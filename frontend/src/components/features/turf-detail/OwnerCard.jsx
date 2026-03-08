import React from 'react';
import './OwnerCard.css';

/**
 * OwnerCard - Owner/business information
 */
const OwnerCard = ({
    ownerName = '',
    ownerPhone = ''
}) => {
    const maskPhone = (phone) => {
        if (!phone || phone.length < 10) return phone;
        const visible = phone.slice(0, 6);
        const masked = 'X'.repeat(phone.length - 6);
        return visible + masked;
    };

    const handleContact = () => {
        // In a real app, this would open a contact modal or reveal full number
        alert(`Contact: ${ownerName}\nPhone: ${ownerPhone}`);
    };

    return (
        <section className="owner-section">
            <div className="section-header">
                <h2>About the Owner</h2>
            </div>

            <div className="owner-card">
                <div className="owner-label">Managed by</div>
                <div className="owner-name">{ownerName}</div>
                <div className="owner-phone">{maskPhone(ownerPhone)}</div>
                <button className="contact-owner-btn" onClick={handleContact}>
                    Contact Owner
                </button>
            </div>
        </section>
    );
};

export default OwnerCard;
