import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { auth, db, storage } from '../../services/firebase';
import { OwnerData, TurfData } from '../../types/owner';
import styles from '../../styles/Owner/MyTurf.module.css';

// ═══════════════════════════════════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════════════════════════════════
const TABS = [
    { id: 'hero', icon: '🖼️', label: 'Hero' },
    { id: 'about', icon: '📝', label: 'About' },
    { id: 'sports', icon: '⚽', label: 'Sports' },
    { id: 'amenities', icon: '🏋️', label: 'Amenities' },
    { id: 'timings', icon: '⏰', label: 'Timings' },
    { id: 'location', icon: '📍', label: 'Location' },
    { id: 'pricing', icon: '💰', label: 'Pricing' },
    { id: 'discounts', icon: '🎁', label: 'Discounts' },
    { id: 'gallery', icon: '📸', label: 'Gallery' },
] as const;

type TabId = typeof TABS[number]['id'];
type SyncStatus = 'idle' | 'saving' | 'saved' | 'published' | 'unpublished' | 'live';

const SPORTS_LIST = [
    { emoji: '⚽', name: 'Football' }, { emoji: '🏏', name: 'Cricket' },
    { emoji: '🏸', name: 'Badminton' }, { emoji: '🏀', name: 'Basketball' },
    { emoji: '🏐', name: 'Volleyball' }, { emoji: '🏓', name: 'Pickleball' },
    { emoji: '🎾', name: 'Tennis' },
];

const AMENITIES_LIST = [
    { icon: '🅿️', key: 'Parking' }, { icon: '💡', key: 'Floodlights' },
    { icon: '🚻', key: 'Washroom' }, { icon: '🚿', key: 'Changing Room' },
    { icon: '💧', key: 'Drinking Water' }, { icon: '🍔', key: 'Cafeteria' },
    { icon: '📶', key: 'WiFi' }, { icon: '🩹', key: 'First Aid Kit' },
    { icon: '🪑', key: 'Seating Area' },
];

const GROUND_SIZES = ['5-a-side', '6-a-side', '7-a-side', 'Full Size', 'Half Size', 'Custom'];
const DAYS = ['None', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Default form shape
const defaultForm = (): Partial<TurfData> => ({
    name: '', description: '', sports: [], groundSize: '5-a-side', totalGrounds: 1,
    grounds: [{ id: 'ground-1', name: 'Ground 1', openTime: '06:00', closeTime: '22:00' }],
    amenities: [], openTime: '06:00', closeTime: '22:00', weeklyOff: '',
    hasWeekendHours: false, weekendOpenTime: '06:00', weekendCloseTime: '22:00',
    address: '', area: '', city: '', state: '', pincode: '',
    latitude: 0, longitude: 0,
    pricePerHour: 0, basePrice: 0, weekendPrice: 0,
    hasPeakPricing: false, peakStartTime: '18:00', peakEndTime: '22:00', peakPrice: 0,
    turfStatus: 'available',
    hasDiscount: false, discountType: 'percentage', discountValue: 0,
    discountDescription: '', promoCode: '', discountValidUntil: '', discountBadgeText: '',
    images: [], tags: [],
});

// ═══════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════
export function OwnerTurf() {
    const [ownerData, setOwnerData] = useState<OwnerData | null>(null);
    const [turfId, setTurfId] = useState('');
    const [formData, setFormData] = useState<Partial<TurfData>>(defaultForm());
    const [publishedData, setPublishedData] = useState<Partial<TurfData>>({});
    const [activeTab, setActiveTab] = useState<TabId>('hero');
    const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
    const [dirtyTabs, setDirtyTabs] = useState<Set<TabId>>(new Set());
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('mobile');
    const [previewMode, setPreviewMode] = useState<'draft' | 'live'>('draft');
    const [showBottomSheet, setShowBottomSheet] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [previewImg, setPreviewImg] = useState(0);
    const [liveSyncEnabled, setLiveSyncEnabled] = useState(true);
    const [lastLiveSyncAt, setLastLiveSyncAt] = useState('');

    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);
    const formDataRef = useRef(formData);

    // Keep formDataRef in sync so autoSave always saves the latest state
    useEffect(() => { formDataRef.current = formData; }, [formData]);

    // ── Normalize Firestore data to match the editor form field names ──
    // Firestore may store data with different keys than what the form uses:
    //   about → description,  isDiscountActive → hasDiscount,
    //   discountPercent → discountValue,  geoPoint → latitude/longitude,
    //   status → turfStatus,  Washrooms → Washroom, etc.
    const normalizeFirestoreToForm = (raw: any): Partial<TurfData> => {
        const data: any = { ...raw };

        // about → description
        if (raw.about && !raw.description) data.description = raw.about;

        // isDiscountActive → hasDiscount
        if (raw.isDiscountActive !== undefined && raw.hasDiscount === undefined)
            data.hasDiscount = !!raw.isDiscountActive;

        // discountPercent → discountValue + discountType
        if (raw.discountPercent && !raw.discountValue) {
            data.discountValue = raw.discountPercent;
            data.discountType = 'percentage';
        }

        // discountDescription (sometimes stored without prefix)
        if (raw.discountDescription && !data.discountDescription)
            data.discountDescription = raw.discountDescription;

        // nested discount: { active, percent, description }
        if (raw.discount && typeof raw.discount === 'object') {
            if (data.hasDiscount === undefined) data.hasDiscount = raw.discount.active ?? false;
            if (!data.discountValue && raw.discount.percent) {
                data.discountValue = raw.discount.percent;
                data.discountType = 'percentage';
            }
            if (!data.discountDescription && raw.discount.description) {
                data.discountDescription = raw.discount.description;
            }
        }

        // status → turfStatus  ('active'/'available' → 'available')
        if (raw.status && !raw.turfStatus) {
            const s = raw.status;
            data.turfStatus = s === 'active' || s === 'available' ? 'available'
                : s === 'inactive' || s === 'closed' ? 'closed' : 'maintenance';
        }

        // single sport field → sports array
        if (!Array.isArray(raw.sports) && raw.sport) {
            data.sports = [raw.sport];
        }

        // coverImage fallback
        if ((!Array.isArray(raw.images) || raw.images.length === 0) && raw.coverImage) {
            data.images = [raw.coverImage];
        }

        // nested location fallback
        if (raw.location && typeof raw.location === 'object') {
            if (!data.address && raw.location.address) data.address = raw.location.address;
            if (!data.city && raw.location.city) data.city = raw.location.city;
            if (!data.state && raw.location.state) data.state = raw.location.state;
            if (!data.pincode && raw.location.pincode) data.pincode = String(raw.location.pincode);
            if (!data.latitude && raw.location.coordinates?.lat) data.latitude = raw.location.coordinates.lat;
            if (!data.longitude && raw.location.coordinates?.lng) data.longitude = raw.location.coordinates.lng;
        }

        // nested operating hours fallback
        if (raw.operatingHours && typeof raw.operatingHours === 'object') {
            if (!data.openTime && raw.operatingHours.opensAt) data.openTime = raw.operatingHours.opensAt;
            if (!data.closeTime && raw.operatingHours.closesAt) data.closeTime = raw.operatingHours.closesAt;
        }

        // nested pricing fallback
        if (raw.pricing && typeof raw.pricing === 'object') {
            if (!data.pricePerHour && raw.pricing.basePrice) data.pricePerHour = raw.pricing.basePrice;
            if (!data.basePrice && raw.pricing.basePrice) data.basePrice = raw.pricing.basePrice;
            if (!data.weekendPrice && raw.pricing.weekendPrice) data.weekendPrice = raw.pricing.weekendPrice;
        }

        // geoPoint → latitude / longitude
        if (raw.geoPoint && (!raw.latitude || !raw.longitude)) {
            data.latitude = raw.geoPoint.latitude ?? raw.geoPoint._lat ?? 0;
            data.longitude = raw.geoPoint.longitude ?? raw.geoPoint._long ?? 0;
        }

        // basePrice fallback to pricePerHour
        if (!raw.basePrice && raw.pricePerHour) data.basePrice = raw.pricePerHour;

        // Normalize amenities names (Washrooms → Washroom, First Aid Kit stays)
        if (Array.isArray(data.amenities)) {
            const amenityMap: Record<string, string> = {
                'Washrooms': 'Washroom',
                'First Aid': 'First Aid Kit',
            };
            data.amenities = data.amenities.map((a: string) => amenityMap[a] || a);
        }

        return data as Partial<TurfData>;
    };

    // ── Load data ── wait for Firebase Auth to be ready first
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const ownerDoc = await getDoc(doc(db, 'owners', user.uid));
                if (!ownerDoc.exists()) { setLoading(false); return; }
                const owner = ownerDoc.data() as OwnerData;
                setOwnerData(owner);
                setTurfId(owner.turfId);

                // Try draft first, fall back to published
                const draftDoc = await getDoc(doc(db, 'turf', owner.turfId, 'drafts', 'current'));
                const turfDoc = await getDoc(doc(db, 'turf', owner.turfId));

                if (turfDoc.exists()) {
                    const raw = turfDoc.data();
                    const normalized = normalizeFirestoreToForm(raw);
                    const pub = { id: turfDoc.id, ...normalized } as TurfData;

                    setPublishedData(pub);
                    if (draftDoc.exists()) {
                        const draftNormalized = normalizeFirestoreToForm(draftDoc.data());
                        setFormData({ ...defaultForm(), ...pub, ...draftNormalized });
                        setSyncStatus('unpublished');
                    } else {
                        setFormData({ ...defaultForm(), ...pub });
                        setSyncStatus('published');
                    }
                } else if (draftDoc.exists()) {
                    const draftNormalized = normalizeFirestoreToForm(draftDoc.data());
                    setPublishedData({});
                    setFormData({ ...defaultForm(), ...draftNormalized });
                    setSyncStatus('unpublished');
                } else {
                    setPublishedData({});
                    setFormData(defaultForm());
                    setSyncStatus('idle');
                }
            } catch (e) { console.error('Error loading turf data:', e); }
            finally { setLoading(false); }
        });

        return () => unsubscribe();
    }, []);

    // ── Keep published/live data in sync in real-time ──
    useEffect(() => {
        if (!turfId) return;

        const liveDocRef = doc(db, 'turf', turfId);
        const unsubscribeLive = onSnapshot(
            liveDocRef,
            (snapshot) => {
                if (!snapshot.exists()) {
                    setPublishedData({});
                    return;
                }

                const normalized = normalizeFirestoreToForm(snapshot.data());
                setPublishedData({ id: snapshot.id, ...normalized } as TurfData);
            },
            (error) => {
                console.warn('Live turf sync error:', error);
            }
        );

        return () => unsubscribeLive();
    }, [turfId]);

    // ── Field setter with dirty tracking + auto-save ──
    const setField = useCallback((key: string, value: any, tab?: TabId) => {
        setFormData(prev => ({ ...prev, [key]: value }));
        if (tab) setDirtyTabs(prev => new Set(prev).add(tab));
        setSyncStatus('unpublished');

        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => autoSave(), 1500);
    }, [turfId]);

    const buildPublishPayload = useCallback((source: Partial<TurfData>, withPublishTimestamp: boolean) => {
        const rest: any = { ...source };
        const payload: any = {
            ...rest,
            about: rest.description || rest.about || '',
            description: rest.description || rest.about || '',
            status: rest.turfStatus === 'available' ? 'active'
                : rest.turfStatus === 'closed' ? 'inactive' : rest.turfStatus || 'active',
            isDiscountActive: !!rest.hasDiscount,
            discountPercent: rest.discountValue || 0,
            pricePerHour: rest.pricePerHour || rest.basePrice || 0,
            basePrice: rest.basePrice || rest.pricePerHour || 0,
            updatedAt: serverTimestamp(),
        };

        if (withPublishTimestamp) {
            payload.publishedAt = serverTimestamp();
        }

        return payload;
    }, []);

    const autoSave = async () => {
        if (!turfId) return;
        try {
            setSyncStatus('saving');
            const { id, createdAt, publishedAt, ...rest } = formDataRef.current as any;
            await setDoc(doc(db, 'turf', turfId, 'drafts', 'current'),
                { ...rest, updatedAt: serverTimestamp() }, { merge: true });

            if (liveSyncEnabled) {
                const livePayload = buildPublishPayload(rest, false);
                await setDoc(doc(db, 'turf', turfId), livePayload, { merge: true });
                setPublishedData({ ...defaultForm(), ...rest });
                setLastLiveSyncAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
                setDirtyTabs(new Set());
                setSyncStatus('live');
                return;
            }

            setSyncStatus('saved');
            setTimeout(() => setSyncStatus(s => s === 'saved' ? 'unpublished' : s), 2000);
        } catch (e) { console.error('Auto-save error:', e); setSyncStatus('unpublished'); }
    };

    // ── Publish ──
    const publish = async () => {
        if (!turfId) return;
        const errs = validate();
        if (Object.keys(errs).length > 0) { setErrors(errs); return; }
        try {
            setSyncStatus('saving');
            const { id, ...rest } = formDataRef.current as any;
            const payload = buildPublishPayload(rest, true);

            await setDoc(doc(db, 'turf', turfId), payload, { merge: true });
            setPublishedData({ ...formDataRef.current });
            setDirtyTabs(new Set());
            setSyncStatus('published');
            setLastLiveSyncAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        } catch (e) { console.error('Publish error:', e); alert('Publish failed'); }
    };

    // ── Reset ──
    const resetForm = () => {
        if (!confirm('Discard all unsaved changes?')) return;
        setFormData({ ...defaultForm(), ...publishedData });
        setDirtyTabs(new Set());
        setSyncStatus('published');
        setErrors({});
    };

    // ── Validation ──
    const validate = (): Record<string, string> => {
        const e: Record<string, string> = {};
        if (!formData.name?.trim()) e.name = 'Turf name is required';
        if (!formData.openTime) e.openTime = 'Opening time is required';
        if (!formData.closeTime) e.closeTime = 'Closing time is required';
        if (formData.openTime && formData.closeTime && formData.closeTime <= formData.openTime)
            e.closeTime = 'Closing time must be after opening time';
        if (!formData.pricePerHour || formData.pricePerHour <= 0) e.pricePerHour = 'Price must be positive';
        if (formData.pincode && !/^\d{6}$/.test(formData.pincode)) e.pincode = 'Enter valid 6-digit pincode';
        if (formData.hasDiscount && formData.discountValidUntil) {
            if (new Date(formData.discountValidUntil) < new Date()) e.discountValidUntil = 'Must be future date';
        }
        return e;
    };

    // ── Image Upload ──
    const uploadImage = async (file: File) => {
        if (!turfId) { alert('Turf ID not found. Please reload.'); return; }
        if (file.size > 5 * 1024 * 1024) { alert('Image too large. Max 5MB.'); return; }
        try {
            setUploading(true); setUploadProgress(0);
            const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
            const storageRef = ref(storage, `turfs/${turfId}/images/${fileName}`);
            const task = uploadBytesResumable(storageRef, file);

            // Wrap in a proper promise so we can await completion/error
            await new Promise<void>((resolve, reject) => {
                task.on(
                    'state_changed',
                    (snapshot) => {
                        setUploadProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100));
                    },
                    (error) => {
                        console.error('Upload state error:', error);
                        reject(error);
                    },
                    () => resolve()
                );
            });

            const url = await getDownloadURL(storageRef);

            // Use functional update to avoid stale closure on formData.images
            setFormData(prev => {
                const currentImages = prev.images || [];
                const updated = [...currentImages, url];
                // Trigger dirty tracking + auto-save
                setDirtyTabs(d => new Set(d).add('gallery'));
                setSyncStatus('unpublished');
                if (saveTimer.current) clearTimeout(saveTimer.current);
                saveTimer.current = setTimeout(() => autoSave(), 1500);
                return { ...prev, images: updated };
            });
        } catch (e: any) {
            console.error('Upload error:', e);
            const msg = e?.code === 'storage/unauthorized'
                ? 'Upload failed: Storage permissions not set. Please check Firebase Storage rules.'
                : e?.code === 'storage/canceled'
                    ? 'Upload cancelled.'
                    : `Upload failed: ${e?.message || 'Unknown error'}`;
            alert(msg);
        } finally {
            setUploading(false); setUploadProgress(0);
        }
    };

    // Upload multiple files sequentially to avoid overwriting each other
    const uploadMultipleImages = async (files: FileList) => {
        for (const file of Array.from(files)) {
            await uploadImage(file);
        }
    };

    const removeImage = async (index: number) => {
        if (!confirm('Remove this image?')) return;
        const imgs = [...(formData.images || [])];
        const url = imgs[index];
        imgs.splice(index, 1);
        setFormData(prev => ({ ...prev, images: imgs }));
        setDirtyTabs(d => new Set(d).add('gallery'));
        setSyncStatus('unpublished');
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => autoSave(), 1500);
        try { await deleteObject(ref(storage, url)); } catch { /* already gone */ }
    };

    const setFeaturedImage = (index: number) => {
        const imgs = [...(formData.images || [])];
        const [img] = imgs.splice(index, 1);
        imgs.unshift(img);
        setField('images', imgs, 'hero');
    };

    const getLocation = () => {
        navigator.geolocation.getCurrentPosition(
            pos => {
                setField('latitude', pos.coords.latitude, 'location');
                setField('longitude', pos.coords.longitude, 'location');
            },
            () => alert('Unable to get location')
        );
    };

    // ── Sync Badge ──
    const syncBadge = () => {
        const map: Record<SyncStatus, { text: string; cls: string }> = {
            idle: { text: '⚪ Ready', cls: styles.syncIdle },
            saving: { text: '🔄 Syncing...', cls: styles.syncSaving },
            saved: { text: '💾 Draft Saved', cls: styles.syncSaved },
            published: { text: '🟢 Published', cls: styles.syncPublished },
            unpublished: { text: '🟡 Unpublished changes', cls: styles.syncUnpublished },
            live: { text: '🟢 Live synced', cls: styles.syncPublished },
        };
        const s = map[syncStatus];
        return <span className={`${styles.syncBadge} ${s.cls}`}>{s.text}</span>;
    };

    // ── Format time for preview ──
    const fmt12 = (t: string) => {
        if (!t) return '';
        const h = parseInt(t.split(':')[0]);
        const ampm = h >= 12 ? 'PM' : 'AM';
        return `${h > 12 ? h - 12 : h === 0 ? 12 : h}:${t.split(':')[1]} ${ampm}`;
    };

    // ── Computed ──
    const images = formData.images || [];
    const amenities = formData.amenities || [];
    const sports = formData.sports || [];
    const tags = formData.tags || [];
    const grounds = formData.grounds || [];

    const completion = useMemo(() => {
        const checks = [
            !!formData.name?.trim(),
            !!images.length,
            !!formData.description?.trim(),
            sports.length > 0,
            amenities.length > 0,
            !!formData.openTime && !!formData.closeTime,
            !!formData.address?.trim() && !!formData.city?.trim(),
            Number(formData.pricePerHour || 0) > 0,
        ];
        const done = checks.filter(Boolean).length;
        return Math.round((done / checks.length) * 100);
    }, [formData, images.length, sports.length, amenities.length]);

    const discountedPrice = useMemo(() => {
        if (!formData.hasDiscount || !formData.discountValue) return formData.pricePerHour || 0;
        const base = formData.pricePerHour || 0;
        if (formData.discountType === 'percentage') return Math.round(base * (1 - (formData.discountValue / 100)));
        return Math.max(base - formData.discountValue, 0);
    }, [formData.pricePerHour, formData.hasDiscount, formData.discountType, formData.discountValue]);

    // ═══════════════════════════════════════════════════════════════
    //  LOADING / ERROR
    // ═══════════════════════════════════════════════════════════════
    if (loading) return (
        <div className={styles.loading}>
            <div className={styles.loadingIcon}>⏳</div>
            <div>Loading turf details...</div>
        </div>
    );

    if (!ownerData) return (
        <div className={styles.loading}>
            <div className={styles.loadingIcon}>❌</div>
            <div>Unable to load turf data</div>
        </div>
    );

    // ═══════════════════════════════════════════════════════════════
    //  PREVIEW PANEL (renders inside right panel / bottom sheet)
    // ═══════════════════════════════════════════════════════════════
    const renderPreview = (previewData: Partial<TurfData>) => {
        const previewImages = previewData.images || [];
        const previewAmenities = previewData.amenities || [];
        const previewSports = previewData.sports || [];
        const previewTags = previewData.tags || [];
        const previewDiscountedPrice = (() => {
            if (!previewData.hasDiscount || !previewData.discountValue) return previewData.pricePerHour || 0;
            const base = previewData.pricePerHour || 0;
            if (previewData.discountType === 'percentage') return Math.round(base * (1 - (previewData.discountValue / 100)));
            return Math.max(base - previewData.discountValue, 0);
        })();

        return (
        <div className={previewDevice === 'mobile' ? styles.previewMobileFrame : ''}>
            {/* Hero */}
            <div className={styles.pvHero}>
                {previewImages.length > 0 ? (
                    <img src={previewImages[previewImg] || previewImages[0]} className={styles.pvHeroImg} alt="Hero" />
                ) : (
                    <div className={styles.pvHeroImg} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>🏟️</div>
                )}
                <div className={styles.pvHeroOverlay}>
                    <div className={styles.pvHeroName}>{previewData.name || 'Turf Name'}</div>
                    <div className={styles.pvHeroPrice}>
                        {previewData.hasDiscount && previewData.discountValue ? (
                            <><span className={styles.pvPriceStrike}>₹{previewData.pricePerHour}</span> ₹{previewDiscountedPrice}/hr</>
                        ) : <>₹{previewData.pricePerHour || 0}/hr</>}
                    </div>
                </div>
                {previewData.turfStatus && (
                    <div className={styles.pvStatusBadge} style={{
                        background: previewData.turfStatus === 'available' ? '#16A34A' : previewData.turfStatus === 'closed' ? '#DC2626' : '#D97706'
                    }}>
                        {previewData.turfStatus === 'available' ? 'Open' : previewData.turfStatus === 'closed' ? 'Closed' : 'Maintenance'}
                    </div>
                )}
                {previewData.hasDiscount && previewData.discountBadgeText && (
                    <div className={styles.pvDiscountBadge}>{previewData.discountBadgeText}</div>
                )}
            </div>

            {/* Thumbs */}
            {previewImages.length > 1 && (
                <div className={styles.pvThumbs}>
                    {previewImages.slice(0, 4).map((img, i) => (
                        <img key={i} src={img} alt="" className={`${styles.pvThumb} ${i === previewImg ? styles.pvThumbActive : ''}`}
                            onClick={() => setPreviewImg(i)} />
                    ))}
                </div>
            )}

            {/* About */}
            <div className={styles.pvSection}>
                <div className={styles.pvSectionTitle}>About This Turf</div>
                <div className={styles.pvText}>{previewData.description || 'No description yet.'}</div>
                {previewTags.length > 0 && (
                    <div className={styles.pvPillRow} style={{ marginTop: 10 }}>
                        {previewTags.map((t, i) => <span key={i} className={`${styles.pvPill} ${styles.pvPillAccent}`}>{t}</span>)}
                    </div>
                )}
            </div>

            {/* Sports */}
            {previewSports.length > 0 && (
                <div className={styles.pvSection}>
                    <div className={styles.pvSectionTitle}>Sports</div>
                    <div className={styles.pvPillRow}>
                        {previewSports.map(s => <span key={s} className={styles.pvPill}>{SPORTS_LIST.find(x => x.name === s)?.emoji} {s}</span>)}
                        <span className={styles.pvPill}>{previewData.groundSize}</span>
                        <span className={styles.pvPill}>🏟️ {previewData.totalGrounds} Ground{(previewData.totalGrounds || 1) > 1 ? 's' : ''}</span>
                    </div>
                </div>
            )}

            {/* Amenities */}
            {previewAmenities.length > 0 && (
                <div className={styles.pvSection}>
                    <div className={styles.pvSectionTitle}>Amenities</div>
                    <div className={styles.pvAmenGrid}>
                        {previewAmenities.map(a => {
                            const item = AMENITIES_LIST.find(x => x.key === a);
                            return <div key={a} className={styles.pvAmenItem}>{item?.icon || '✔️'} {a}</div>;
                        })}
                    </div>
                </div>
            )}

            {/* Timings */}
            <div className={styles.pvSection}>
                <div className={styles.pvSectionTitle}>Timings</div>
                <div className={styles.pvText}>
                    🕐 {fmt12(previewData.openTime || '')} – {fmt12(previewData.closeTime || '')}
                </div>
                <div className={styles.pvText}>
                    {previewData.weeklyOff ? `Weekly off: ${previewData.weeklyOff}` : 'Open all 7 days'}
                </div>
            </div>

            {/* Location */}
            {previewData.address && (
                <div className={styles.pvSection}>
                    <div className={styles.pvSectionTitle}>Location</div>
                    <div className={styles.pvText}>
                        {previewData.address}{previewData.area ? `, ${previewData.area}` : ''}{previewData.city ? `, ${previewData.city}` : ''}
                        {previewData.state ? `, ${previewData.state}` : ''}{previewData.pincode ? ` - ${previewData.pincode}` : ''}
                    </div>
                    {previewData.latitude && previewData.longitude && (
                        <iframe className={styles.pvMap} title="Map"
                            src={`https://maps.google.com/maps?q=${previewData.latitude},${previewData.longitude}&output=embed`}
                            loading="lazy" />
                    )}
                </div>
            )}

            {/* Pricing */}
            <div className={styles.pvSection}>
                <div className={styles.pvSectionTitle}>Pricing</div>
                <div className={styles.pvPrice}>
                    {previewData.hasDiscount && previewData.discountValue ? (
                        <><span className={styles.pvPriceStrike}>₹{previewData.pricePerHour}</span> ₹{previewDiscountedPrice}/hr</>
                    ) : <>₹{previewData.pricePerHour || 0}/hr</>}
                </div>
                {previewData.hasPeakPricing && previewData.peakPrice && (
                    <div className={styles.pvText} style={{ marginTop: 4 }}>
                        Peak: ₹{previewData.peakPrice}/hr ({fmt12(previewData.peakStartTime || '')} – {fmt12(previewData.peakEndTime || '')})
                    </div>
                )}
                {previewData.hasDiscount && previewData.promoCode && (
                    <div className={styles.pvPromo}>🏷️ Use code: {previewData.promoCode}</div>
                )}
            </div>
        </div>
    );
    };

    // ═══════════════════════════════════════════════════════════════
    //  TAB CONTENT RENDERERS
    // ═══════════════════════════════════════════════════════════════

    const renderHeroTab = () => (
        <>
            <div className={styles.tabTitle}>🖼️ Hero Image</div>
            {images.length > 0 && images[0] ? (
                <>
                    <img src={images[0]} alt="Featured" className={styles.heroPreviewImg} />
                    <div className={styles.imgActions}>
                        <button className={styles.imgBtn} onClick={() => fileInputRef.current?.click()}>📷 Change Image</button>
                        <button className={`${styles.imgBtn} ${styles.imgBtnDanger}`} onClick={() => removeImage(0)}>🗑️ Remove</button>
                    </div>
                </>
            ) : (
                <div className={styles.dropZone} onClick={() => fileInputRef.current?.click()}>
                    <div className={styles.dropZoneIcon}>📷</div>
                    <div className={styles.dropZoneText}>Click to upload featured image</div>
                    <div className={styles.dropZoneHint}>JPG, PNG, WEBP · Max 5MB</div>
                </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={e => { if (e.target.files?.[0]) { uploadImage(e.target.files[0]); e.target.value = ''; } }} />
            {uploading && (
                <div className={styles.uploadProgress}>
                    <div style={{ fontSize: 13, color: '#6B7280' }}>Uploading... {uploadProgress}%</div>
                    <div className={styles.progressBar}><div className={styles.progressFill} style={{ width: `${uploadProgress}%` }} /></div>
                </div>
            )}
            {images.length > 1 && (
                <>
                    <div className={styles.label} style={{ marginTop: 20 }}>Gallery Thumbnails</div>
                    <div className={styles.thumbGrid}>
                        {images.slice(1).map((img, i) => (
                            <div key={i} className={styles.thumbCard}>
                                <img src={img} alt="" className={styles.thumbImg} />
                                <div className={styles.thumbActions}>
                                    <button className={styles.thumbBtn} onClick={() => setFeaturedImage(i + 1)} title="Set as featured">📌</button>
                                    <button className={styles.thumbBtn} onClick={() => removeImage(i + 1)} title="Remove">🗑️</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </>
    );

    const renderAboutTab = () => (
        <>
            <div className={styles.tabTitle}>📝 About</div>
            <div className={styles.fieldGroup}>
                <label className={styles.label}>Turf Name *</label>
                <input className={`${styles.input} ${errors.name ? styles.inputError : ''}`} value={formData.name || ''}
                    onChange={e => setField('name', e.target.value, 'about')}
                    onBlur={() => { if (!formData.name?.trim()) setErrors(p => ({ ...p, name: 'Required' })); else setErrors(p => { const { name, ...r } = p; return r; }); }}
                />
                {errors.name && <div className={styles.errorText}>{errors.name}</div>}
            </div>
            <div className={styles.fieldGroup}>
                <label className={styles.label}>Description</label>
                <textarea className={styles.textarea} value={formData.description || ''} maxLength={500}
                    onChange={e => setField('description', e.target.value, 'about')} rows={5} />
                <div className={styles.charCount}>{(formData.description || '').length}/500</div>
            </div>
            <div className={styles.fieldGroup}>
                <label className={styles.label}>Tags <span className={styles.labelHint}>Press Enter to add</span></label>
                <div className={styles.tagsWrap}>
                    {tags.map((t, i) => (
                        <span key={i} className={styles.tag}>{t}
                            <button className={styles.tagRemove} onClick={() => setField('tags', tags.filter((_, j) => j !== i), 'about')}>×</button>
                        </span>
                    ))}
                </div>
                <input className={styles.input} placeholder="e.g. Artificial Grass"
                    onKeyDown={e => {
                        if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                            setField('tags', [...tags, (e.target as HTMLInputElement).value.trim()], 'about');
                            (e.target as HTMLInputElement).value = '';
                            e.preventDefault();
                        }
                    }} />
            </div>
        </>
    );

    const renderSportsTab = () => (
        <>
            <div className={styles.tabTitle}>⚽ Sports & Ground</div>
            <div className={styles.fieldGroup}>
                <label className={styles.label}>Sports Offered</label>
                <div className={styles.checkboxGrid}>
                    {SPORTS_LIST.map(s => (
                        <div key={s.name} className={`${styles.checkboxItem} ${sports.includes(s.name) ? styles.checkboxItemActive : ''}`}
                            onClick={() => setField('sports', sports.includes(s.name) ? sports.filter(x => x !== s.name) : [...sports, s.name], 'sports')}>
                            {s.emoji} {s.name}
                        </div>
                    ))}
                </div>
            </div>
            <div className={styles.fieldRow}>
                <div className={styles.fieldGroup}>
                    <label className={styles.label}>Ground Size</label>
                    <select className={styles.select} value={formData.groundSize || ''} onChange={e => setField('groundSize', e.target.value, 'sports')}>
                        {GROUND_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div className={styles.fieldGroup}>
                    <label className={styles.label}>Total Grounds</label>
                    <div className={styles.stepper}>
                        <button className={styles.stepperBtn} onClick={() => {
                            const n = Math.max(1, (formData.totalGrounds || 1) - 1);
                            setField('totalGrounds', n, 'sports');
                            setField('grounds', Array.from({ length: n }, (_, i) => grounds[i] || { id: `ground-${i + 1}`, name: `Ground ${i + 1}`, openTime: '06:00', closeTime: '22:00' }), 'sports');
                        }}>−</button>
                        <input className={styles.stepperValue} value={formData.totalGrounds || 1} readOnly />
                        <button className={styles.stepperBtn} onClick={() => {
                            const n = (formData.totalGrounds || 1) + 1;
                            setField('totalGrounds', n, 'sports');
                            setField('grounds', Array.from({ length: n }, (_, i) => grounds[i] || { id: `ground-${i + 1}`, name: `Ground ${i + 1}`, openTime: '06:00', closeTime: '22:00' }), 'sports');
                        }}>+</button>
                    </div>
                </div>
            </div>
            <div className={styles.fieldGroup}>
                <label className={styles.label}>Ground Names</label>
                <div className={styles.groundInputs}>
                    {Array.from({ length: formData.totalGrounds || 1 }, (_, i) => (
                        <div key={i} className={styles.groundInputRow}>
                            <span className={styles.groundInputLabel}>Ground {i + 1}:</span>
                            <input className={styles.input} value={grounds[i]?.name || `Ground ${i + 1}`}
                                onChange={e => {
                                    const g = [...grounds];
                                    g[i] = { ...g[i], name: e.target.value };
                                    setField('grounds', g, 'sports');
                                }} />
                        </div>
                    ))}
                </div>
            </div>
        </>
    );

    const renderAmenitiesTab = () => (
        <>
            <div className={styles.tabTitle}>🏋️ Amenities</div>
            {AMENITIES_LIST.map(a => (
                <div key={a.key} className={styles.toggleRow}>
                    <div className={styles.toggleLabel}>
                        <span className={styles.toggleIcon}>{a.icon}</span> {a.key}
                    </div>
                    <button className={`${styles.toggle} ${amenities.includes(a.key) ? styles.toggleOn : ''}`}
                        onClick={() => setField('amenities', amenities.includes(a.key) ? amenities.filter(x => x !== a.key) : [...amenities, a.key], 'amenities')} />
                </div>
            ))}
        </>
    );

    const renderTimingsTab = () => (
        <>
            <div className={styles.tabTitle}>⏰ Timings</div>
            <div className={styles.fieldRow}>
                <div className={styles.fieldGroup}>
                    <label className={styles.label}>Opening Time</label>
                    <input type="time" className={`${styles.input} ${errors.openTime ? styles.inputError : ''}`} value={formData.openTime || ''}
                        onChange={e => setField('openTime', e.target.value, 'timings')} />
                </div>
                <div className={styles.fieldGroup}>
                    <label className={styles.label}>Closing Time</label>
                    <input type="time" className={`${styles.input} ${errors.closeTime ? styles.inputError : ''}`} value={formData.closeTime || ''}
                        onChange={e => setField('closeTime', e.target.value, 'timings')} />
                    {errors.closeTime && <div className={styles.errorText}>{errors.closeTime}</div>}
                </div>
            </div>
            <div className={styles.fieldGroup}>
                <label className={styles.label}>Weekly Off</label>
                <select className={styles.select} value={formData.weeklyOff || ''} onChange={e => setField('weeklyOff', e.target.value, 'timings')}>
                    {DAYS.map(d => <option key={d} value={d === 'None' ? '' : d}>{d}</option>)}
                </select>
            </div>
            <div className={styles.fieldGroup}>
                <label className={styles.label}>Weekend Hours</label>
                <div className={styles.radioGroup}>
                    <label className={`${styles.radioLabel} ${!formData.hasWeekendHours ? styles.radioLabelActive : ''}`}
                        onClick={() => setField('hasWeekendHours', false, 'timings')}>● Same as weekdays</label>
                    <label className={`${styles.radioLabel} ${formData.hasWeekendHours ? styles.radioLabelActive : ''}`}
                        onClick={() => setField('hasWeekendHours', true, 'timings')}>○ Custom weekend hours</label>
                </div>
            </div>
            {formData.hasWeekendHours && (
                <div className={styles.fieldRow}>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Weekend Open</label>
                        <input type="time" className={styles.input} value={formData.weekendOpenTime || ''}
                            onChange={e => setField('weekendOpenTime', e.target.value, 'timings')} />
                    </div>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Weekend Close</label>
                        <input type="time" className={styles.input} value={formData.weekendCloseTime || ''}
                            onChange={e => setField('weekendCloseTime', e.target.value, 'timings')} />
                    </div>
                </div>
            )}
        </>
    );

    const renderLocationTab = () => (
        <>
            <div className={styles.tabTitle}>📍 Location</div>
            <div className={styles.fieldGroup}>
                <label className={styles.label}>Address</label>
                <input className={styles.input} value={formData.address || ''} onChange={e => setField('address', e.target.value, 'location')} />
            </div>
            <div className={styles.fieldRow}>
                <div className={styles.fieldGroup}>
                    <label className={styles.label}>Area</label>
                    <input className={styles.input} value={formData.area || ''} onChange={e => setField('area', e.target.value, 'location')} />
                </div>
                <div className={styles.fieldGroup}>
                    <label className={styles.label}>City</label>
                    <input className={styles.input} value={formData.city || ''} onChange={e => setField('city', e.target.value, 'location')} />
                </div>
            </div>
            <div className={styles.fieldRow}>
                <div className={styles.fieldGroup}>
                    <label className={styles.label}>State</label>
                    <input className={styles.input} value={formData.state || ''} onChange={e => setField('state', e.target.value, 'location')} />
                </div>
                <div className={styles.fieldGroup}>
                    <label className={styles.label}>Pincode</label>
                    <input className={`${styles.input} ${errors.pincode ? styles.inputError : ''}`} value={formData.pincode || ''} maxLength={6}
                        onChange={e => setField('pincode', e.target.value.replace(/\D/g, ''), 'location')} />
                    {errors.pincode && <div className={styles.errorText}>{errors.pincode}</div>}
                </div>
            </div>
            <div className={styles.fieldRow}>
                <div className={styles.fieldGroup}>
                    <label className={styles.label}>Latitude</label>
                    <input type="number" step="any" className={styles.input} value={formData.latitude || ''} onChange={e => setField('latitude', parseFloat(e.target.value) || 0, 'location')} />
                </div>
                <div className={styles.fieldGroup}>
                    <label className={styles.label}>Longitude</label>
                    <input type="number" step="any" className={styles.input} value={formData.longitude || ''} onChange={e => setField('longitude', parseFloat(e.target.value) || 0, 'location')} />
                </div>
            </div>
            <button className={styles.imgBtn} style={{ marginBottom: 16 }} onClick={getLocation}>📍 Copy from browser location</button>
            {formData.latitude && formData.longitude ? (
                <iframe className={styles.pvMap} title="Map" style={{ height: 220 }}
                    src={`https://maps.google.com/maps?q=${formData.latitude},${formData.longitude}&output=embed`} loading="lazy" />
            ) : null}
        </>
    );

    const renderPricingTab = () => (
        <>
            <div className={styles.tabTitle}>💰 Pricing</div>
            <div className={styles.fieldGroup}>
                <label className={styles.label}>Base Price (₹/hour) *</label>
                <input type="number" className={`${styles.input} ${errors.pricePerHour ? styles.inputError : ''}`} value={formData.pricePerHour || ''}
                    onChange={e => {
                        const v = parseInt(e.target.value) || 0;
                        setField('pricePerHour', v, 'pricing');
                        setField('basePrice', v, 'pricing');
                    }} />
                {errors.pricePerHour && <div className={styles.errorText}>{errors.pricePerHour}</div>}
            </div>
            <div className={styles.fieldGroup}>
                <label className={styles.label}>Weekend Pricing</label>
                <div className={styles.radioGroup}>
                    <label className={`${styles.radioLabel} ${!formData.weekendPrice ? styles.radioLabelActive : ''}`}
                        onClick={() => setField('weekendPrice', 0, 'pricing')}>● Same as base</label>
                    <label className={`${styles.radioLabel} ${formData.weekendPrice ? styles.radioLabelActive : ''}`}
                        onClick={() => setField('weekendPrice', formData.pricePerHour || 0, 'pricing')}>○ Custom</label>
                </div>
            </div>
            {!!formData.weekendPrice && (
                <div className={styles.fieldGroup}>
                    <label className={styles.label}>Weekend Price (₹/hour)</label>
                    <input type="number" className={styles.input} value={formData.weekendPrice || ''} onChange={e => setField('weekendPrice', parseInt(e.target.value) || 0, 'pricing')} />
                </div>
            )}
            <div className={styles.toggleRow}>
                <div className={styles.toggleLabel}><span className={styles.toggleIcon}>⏰</span> Peak Hour Pricing</div>
                <button className={`${styles.toggle} ${formData.hasPeakPricing ? styles.toggleOn : ''}`}
                    onClick={() => setField('hasPeakPricing', !formData.hasPeakPricing, 'pricing')} />
            </div>
            {formData.hasPeakPricing && (
                <div className={styles.fieldRow3}>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Peak Start</label>
                        <input type="time" className={styles.input} value={formData.peakStartTime || ''} onChange={e => setField('peakStartTime', e.target.value, 'pricing')} />
                    </div>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Peak End</label>
                        <input type="time" className={styles.input} value={formData.peakEndTime || ''} onChange={e => setField('peakEndTime', e.target.value, 'pricing')} />
                    </div>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Peak Price (₹/hr)</label>
                        <input type="number" className={styles.input} value={formData.peakPrice || ''} onChange={e => setField('peakPrice', parseInt(e.target.value) || 0, 'pricing')} />
                    </div>
                </div>
            )}
            <div className={styles.fieldGroup} style={{ marginTop: 16 }}>
                <label className={styles.label}>Turf Status</label>
                <div className={styles.radioGroup}>
                    {(['available', 'closed', 'maintenance'] as const).map(s => (
                        <label key={s} className={`${styles.radioLabel} ${formData.turfStatus === s ? styles.radioLabelActive : ''}`}
                            onClick={() => setField('turfStatus', s, 'pricing')}>
                            {s === 'available' ? '🟢 Available' : s === 'closed' ? '🔴 Closed' : '🟡 Maintenance'}
                        </label>
                    ))}
                </div>
            </div>
        </>
    );

    const renderDiscountsTab = () => (
        <>
            <div className={styles.tabTitle}>🎁 Discounts & Offers</div>
            <div className={styles.toggleRow}>
                <div className={styles.toggleLabel}><span className={styles.toggleIcon}>🎁</span> Active Discount</div>
                <button className={`${styles.toggle} ${formData.hasDiscount ? styles.toggleOn : ''}`}
                    onClick={() => setField('hasDiscount', !formData.hasDiscount, 'discounts')} />
            </div>
            {formData.hasDiscount && (
                <>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Discount Type</label>
                        <div className={styles.radioGroup}>
                            <label className={`${styles.radioLabel} ${formData.discountType === 'percentage' ? styles.radioLabelActive : ''}`}
                                onClick={() => setField('discountType', 'percentage', 'discounts')}>● Percentage</label>
                            <label className={`${styles.radioLabel} ${formData.discountType === 'fixed' ? styles.radioLabelActive : ''}`}
                                onClick={() => setField('discountType', 'fixed', 'discounts')}>○ Fixed Amount</label>
                        </div>
                    </div>
                    <div className={styles.fieldRow}>
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>Discount Value {formData.discountType === 'percentage' ? '(%)' : '(₹)'}</label>
                            <input type="number" className={styles.input} value={formData.discountValue || ''}
                                onChange={e => setField('discountValue', parseInt(e.target.value) || 0, 'discounts')} />
                        </div>
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>Promo Code</label>
                            <input className={styles.input} value={formData.promoCode || ''} placeholder="e.g. TURF20"
                                onChange={e => setField('promoCode', e.target.value.toUpperCase(), 'discounts')} />
                        </div>
                    </div>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Description</label>
                        <input className={styles.input} value={formData.discountDescription || ''} placeholder="e.g. Early Bird Offer"
                            onChange={e => setField('discountDescription', e.target.value, 'discounts')} />
                    </div>
                    <div className={styles.fieldRow}>
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>Valid Until</label>
                            <input type="date" className={`${styles.input} ${errors.discountValidUntil ? styles.inputError : ''}`}
                                value={formData.discountValidUntil || ''} onChange={e => setField('discountValidUntil', e.target.value, 'discounts')} />
                            {errors.discountValidUntil && <div className={styles.errorText}>{errors.discountValidUntil}</div>}
                        </div>
                        <div className={styles.fieldGroup}>
                            <label className={styles.label}>Badge Text</label>
                            <input className={styles.input} value={formData.discountBadgeText || ''} placeholder="e.g. 20% OFF"
                                onChange={e => setField('discountBadgeText', e.target.value, 'discounts')} />
                        </div>
                    </div>
                </>
            )}
        </>
    );

    const renderGalleryTab = () => (
        <>
            <div className={styles.tabTitle}>📸 Gallery Manager</div>
            <div className={styles.dropZone} onClick={() => galleryInputRef.current?.click()}>
                <div className={styles.dropZoneIcon}>📸</div>
                <div className={styles.dropZoneText}>Click to upload images</div>
                <div className={styles.dropZoneHint}>JPG, PNG, WEBP · Max 5MB · Up to 8 images</div>
            </div>
            <input ref={galleryInputRef} type="file" accept="image/*" multiple hidden
                onChange={e => { if (e.target.files) { uploadMultipleImages(e.target.files); e.target.value = ''; } }} />
            {uploading && (
                <div className={styles.uploadProgress}>
                    <div style={{ fontSize: 13, color: '#6B7280' }}>Uploading... {uploadProgress}%</div>
                    <div className={styles.progressBar}><div className={styles.progressFill} style={{ width: `${uploadProgress}%` }} /></div>
                </div>
            )}
            {images.length > 0 && (
                <div className={styles.thumbGrid} style={{ marginTop: 20 }}>
                    {images.map((img, i) => (
                        <div key={i} className={`${styles.thumbCard} ${i === 0 ? styles.thumbFeatured : ''}`}>
                            <img src={img} alt="" className={styles.thumbImg} style={{ height: 80 }} />
                            <div className={styles.thumbActions}>
                                {i !== 0 && <button className={styles.thumbBtn} onClick={() => setFeaturedImage(i)} title="Set as featured">📌</button>}
                                <button className={styles.thumbBtn} onClick={() => removeImage(i)} title="Remove">🗑️</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {images.length === 0 && <div style={{ textAlign: 'center', color: '#9CA3AF', margin: '32px 0', fontSize: 14 }}>No images uploaded yet</div>}
        </>
    );

    // Tab content map
    const tabRenderers: Record<TabId, () => JSX.Element> = {
        hero: renderHeroTab, about: renderAboutTab, sports: renderSportsTab,
        amenities: renderAmenitiesTab, timings: renderTimingsTab, location: renderLocationTab,
        pricing: renderPricingTab, discounts: renderDiscountsTab, gallery: renderGalleryTab,
    };

    // ═══════════════════════════════════════════════════════════════
    //  RENDER
    // ═══════════════════════════════════════════════════════════════
    return (
        <div>
            {/* Page Header */}
            <div className={styles.pageHeader}>
                <div className={styles.pageTitle}>
                    🏟️ My Turf <span className={styles.pageTurfName}>· {formData.name || 'Untitled'}</span>
                </div>
                <div className={styles.headerActions}>
                    {syncBadge()}
                    <label className={styles.liveSyncToggle}>
                        <input
                            type="checkbox"
                            checked={liveSyncEnabled}
                            onChange={(e) => setLiveSyncEnabled(e.target.checked)}
                        />
                        <span>Live Sync For Users</span>
                    </label>
                    <button className={styles.resetBtn} onClick={resetForm}>↩️ Reset</button>
                    <button className={styles.publishBtn} onClick={publish} disabled={syncStatus === 'saving'}>
                        {syncStatus === 'saving' ? '🔄 Publishing...' : '🚀 Publish Changes'}
                    </button>
                </div>
            </div>

            <div className={styles.workspaceStrip}>
                <div className={styles.workspaceCard}>
                    <div className={styles.workspaceLabel}>Profile Completion</div>
                    <div className={styles.workspaceValue}>{completion}%</div>
                </div>
                <div className={styles.workspaceCard}>
                    <div className={styles.workspaceLabel}>Sports Configured</div>
                    <div className={styles.workspaceValue}>{sports.length}</div>
                </div>
                <div className={styles.workspaceCard}>
                    <div className={styles.workspaceLabel}>Gallery Images</div>
                    <div className={styles.workspaceValue}>{images.length}</div>
                </div>
                <div className={styles.workspaceCard}>
                    <div className={styles.workspaceLabel}>Last Sync</div>
                    <div className={styles.workspaceValueSmall}>{lastLiveSyncAt || 'Not synced yet'}</div>
                </div>
            </div>

            {/* Split Layout */}
            <div className={styles.splitLayout}>
                {/* LEFT: Editor */}
                <div className={styles.editorPanel}>
                    {/* Tab Bar */}
                    <div className={styles.tabBar}>
                        {TABS.map(t => (
                            <button key={t.id} className={`${styles.tab} ${activeTab === t.id ? styles.tabActive : ''}`}
                                onClick={() => setActiveTab(t.id)}>
                                {t.icon} {t.label}
                                {dirtyTabs.has(t.id) && <span className={styles.tabDot} />}
                            </button>
                        ))}
                    </div>
                    {/* Active Tab Content */}
                    <div className={styles.tabContent}>
                        {tabRenderers[activeTab]()}
                    </div>
                </div>

                {/* RIGHT: Preview */}
                <div className={styles.previewPanel}>
                    <div className={styles.previewHeader}>
                        <div className={styles.previewTitle}>👁️ Live Preview</div>
                        <div className={styles.previewControls}>
                            <div className={styles.deviceSwitcher}>
                                <button className={`${styles.deviceBtn} ${previewMode === 'draft' ? styles.deviceBtnActive : ''}`}
                                    onClick={() => setPreviewMode('draft')}>🛠️ Editing</button>
                                <button className={`${styles.deviceBtn} ${previewMode === 'live' ? styles.deviceBtnActive : ''}`}
                                    onClick={() => setPreviewMode('live')}>🌐 Live</button>
                            </div>
                            <div className={styles.deviceSwitcher}>
                                <button className={`${styles.deviceBtn} ${previewDevice === 'mobile' ? styles.deviceBtnActive : ''}`}
                                    onClick={() => setPreviewDevice('mobile')}>📱 Mobile</button>
                                <button className={`${styles.deviceBtn} ${previewDevice === 'desktop' ? styles.deviceBtnActive : ''}`}
                                    onClick={() => setPreviewDevice('desktop')}>💻 Desktop</button>
                            </div>
                        </div>
                    </div>
                    <div className={styles.previewFrame}>
                        {renderPreview(previewMode === 'live' ? { ...defaultForm(), ...publishedData } : formData)}
                    </div>
                </div>
            </div>

            {/* Mobile Preview Button + Bottom Sheet */}
            <button className={styles.mobilePreviewBtn} onClick={() => setShowBottomSheet(true)}>👁️</button>
            <div className={`${styles.bottomSheetOverlay} ${showBottomSheet ? styles.bottomSheetOverlayOpen : ''}`}
                onClick={() => setShowBottomSheet(false)} />
            <div className={`${styles.bottomSheet} ${showBottomSheet ? styles.bottomSheetOpen : ''}`}>
                <div className={styles.bottomSheetHeader}>
                    <div className={styles.previewTitle}>👁️ Live Preview</div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <div className={styles.deviceSwitcher}>
                            <button className={`${styles.deviceBtn} ${previewMode === 'draft' ? styles.deviceBtnActive : ''}`}
                                onClick={() => setPreviewMode('draft')}>🛠️</button>
                            <button className={`${styles.deviceBtn} ${previewMode === 'live' ? styles.deviceBtnActive : ''}`}
                                onClick={() => setPreviewMode('live')}>🌐</button>
                        </div>
                        <div className={styles.deviceSwitcher}>
                            <button className={`${styles.deviceBtn} ${previewDevice === 'mobile' ? styles.deviceBtnActive : ''}`}
                                onClick={() => setPreviewDevice('mobile')}>📱</button>
                            <button className={`${styles.deviceBtn} ${previewDevice === 'desktop' ? styles.deviceBtnActive : ''}`}
                                onClick={() => setPreviewDevice('desktop')}>💻</button>
                        </div>
                        <button className={styles.bottomSheetClose} onClick={() => setShowBottomSheet(false)}>✕</button>
                    </div>
                </div>
                <div style={{ padding: 16 }}>{renderPreview(previewMode === 'live' ? { ...defaultForm(), ...publishedData } : formData)}</div>
            </div>
        </div>
    );
}
