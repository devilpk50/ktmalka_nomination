var memberData = {
  "5823198": { name: "Leo Nishant Kumar", position: "Immediate Past President", email: "royalnishantm65@gmail.com", contact: "9807895615", duesPaid: true },
  "6147083": { name: "Leo Sujaya Shrestha", position: "Club President", email: "sujay9992@gmail.com", contact: "9803471706", duesPaid: true },
  "6265119": { name: "Leo Barsha Shrestha", position: "Vice President", email: "shresthabarsa07@gmail.com", contact: "9843062422", duesPaid: true },
  "27023774": { name: "Leo Prapti Dhodari", position: "Vice President", email: "praptidhodari13@gmail.com", contact: "9816259520", duesPaid: true },
  "5994629": { name: "Leo Sonika Giri", position: "Secretary", email: "sonikawork2023@gmail.com", contact: "9813036135", duesPaid: true },
  "27021954": { name: "Leo Pratyush Adhikari", position: "Joint Secretary", email: "pratyushadhikari785@gmail.com", contact: "9860171501", duesPaid: true },
  "27023916": { name: "Leo Piyush Raj", position: "Treasurer", email: "praj887857@gmail.com", contact: "9829955290", duesPaid: true },
  "27023842": { name: "Leo Sujana Mulmi", position: "Joint Treasurer", email: "sujanaaa570@gmail.com", contact: "9863020227", duesPaid: true },
  "26854047": { name: "Leo Arpit Shrestha", position: "I.T. & Media Coordinator", email: "sthaarpit@gmail.com", contact: "9841996290", duesPaid: true },
  "27005899": { name: "Leo Bibek Ratna Shakya", position: "Tail Twister", email: "shakyabibekratnashakya1999@gmail.com", contact: "9869178178", duesPaid: true },
  "26854126": { name: "Leo Shraddha Ghimire", position: "Tamer", email: "shraddhaghimire98@gmail.com", contact: "9847388734", duesPaid: true },
  "5155611": { name: "Leo Kashish Dahal", position: "Strategic Director", email: "dahalkashish@gmail.com", contact: "9803457953", duesPaid: true },
  "5945200": { name: "Leo Prashansha Shrestha", position: "Executive Director", email: "Prashanshas123@gmail.com", contact: "9843818467", duesPaid: true },
  "26854117": { name: "Leo Tikaram Khatri", position: "Public Relation Officer", email: "tikaramk200@gmail.com", contact: "9800568785", duesPaid: true },
  "6265169": { name: "Leo Anjali Bishwakarma", position: "Committee Chairperson", email: "anjalibaraili0@gmail.com", contact: "9800993403", duesPaid: true },
  "26854111": { name: "Leo Shishir Giri", position: "Sports Chairperson", email: "shishirgiri435@gmail.com", contact: "9810885567", duesPaid: true },
  "5994652": { name: "Leo Pratistha Shrestha", position: "Club Coordinator", email: "pratiistha145@gmail.com", contact: "9818606813", duesPaid: true },
  "5994669": { name: "Leo Suraj Dulal", position: "Youth Empowerment Committee", email: "surazdulal@gmail.com", contact: "9823776605", duesPaid: true },
  "6265166": { name: "Leo Dikchhya Rauniyar", position: "Signature Project Coordinator", email: "rauniyardikchhya@gmail.com", contact: "9843820573", duesPaid: true },
  "580022": { name: "Leo Test General Member", position: "General Member", email: "testgeneral@gmail.com", contact: "9800000022", duesPaid: true },
  "580023": { name: "Leo Test Member", position: "Member", email: "testmember@gmail.com", contact: "9800000023", duesPaid: true }
};

// IndexedDB helpers for local file storage
const LeoDb = {
    dbName: 'leoNominationsFilesDB',
    storeName: 'files',
    
    open() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName);
                }
            };
            request.onsuccess = (e) => resolve(e.target.result);
            request.onerror = (e) => reject(e.target.error);
        });
    },
    
    async saveFile(subId, fieldName, file) {
        if (!file) return;
        try {
            const db = await this.open();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(this.storeName, 'readwrite');
                const store = tx.objectStore(this.storeName);
                const request = store.put(file, `${subId}_${fieldName}`);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        } catch (err) {
            console.error('Failed to save file to IndexedDB', err);
        }
    },
    
    async getFile(subId, fieldName) {
        try {
            const db = await this.open();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(this.storeName, 'readonly');
                const store = tx.objectStore(this.storeName);
                const request = store.get(`${subId}_${fieldName}`);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } catch (err) {
            console.error('Failed to get file from IndexedDB', err);
            return null;
        }
    },
    
    async deleteSubFiles(subId) {
        try {
            const db = await this.open();
            const tx = db.transaction(this.storeName, 'readwrite');
            const store = tx.objectStore(this.storeName);
            return new Promise((resolve, reject) => {
                const request = store.openKeyCursor();
                request.onsuccess = (e) => {
                    const cursor = e.target.result;
                    if (cursor) {
                        const key = cursor.key;
                        if (key.startsWith(`${subId}_`)) {
                            store.delete(key);
                        }
                        cursor.continue();
                    } else {
                        resolve();
                    }
                };
                request.onerror = () => reject(request.error);
            });
        } catch (err) {
            console.error('Failed to delete files from IndexedDB', err);
        }
    },
    
    async clearAllFiles() {
        try {
            const db = await this.open();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(this.storeName, 'readwrite');
                const store = tx.objectStore(this.storeName);
                const request = store.clear();
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        } catch (err) {
            console.error('Failed to clear all files from IndexedDB', err);
        }
    }
};

// Try to load user-uploaded custom member list from localStorage
try {
    const localMemberDataStr = localStorage.getItem('leoMemberData');
    if (localMemberDataStr) {
        const localMemberData = JSON.parse(localMemberDataStr);
        if (localMemberData && typeof localMemberData === 'object') {
            // Clear existing keys from static list and assign custom ones
            for (const key in memberData) {
                if (memberData.hasOwnProperty(key)) {
                    delete memberData[key];
                }
            }
            Object.assign(memberData, localMemberData);
        }
    }
} catch (e) {
    console.error('Error loading custom member list from localStorage:', e);
}
