import { adminDb as db } from '../src/config/firebaseAdmin.js'

async function setAllComingSoon() {
  const turfs = await db.collection('turf').get()
  
  const batch = db.batch()
  turfs.docs.forEach(doc => {
    batch.update(doc.ref, { isLive: false })
  })
  
  await batch.commit()
  console.log(`✅ Set ${turfs.size} turfs to isLive: false`)
}

setAllComingSoon()
