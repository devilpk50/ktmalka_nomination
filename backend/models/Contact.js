const { QueryChain, readBlobFile, writeBlobFile } = require('./blobDb');
const crypto = require('crypto');

const DB_FILE = 'contacts.json';

class Contact {
    constructor(data) {
        this.name = data.name;
        this.email = data.email;
        this.message = data.message;
        this.submittedAt = data.submittedAt ? new Date(data.submittedAt) : new Date();
        this.read = data.read || false;
        this._id = data._id || crypto.randomUUID();
    }

    async save() {
        const list = await readBlobFile(DB_FILE);
        const index = list.findIndex(item => item._id === this._id);
        const cleanData = {
            _id: this._id,
            name: this.name,
            email: this.email,
            message: this.message,
            submittedAt: this.submittedAt,
            read: this.read
        };
        if (index > -1) {
            list[index] = cleanData;
        } else {
            list.push(cleanData);
        }
        await writeBlobFile(DB_FILE, list);
        return this;
    }

    static find(query = {}) {
        const getFiltered = async () => {
            const list = await readBlobFile(DB_FILE);
            return list.filter(item => {
                for (const key in query) {
                    if (item[key] !== query[key]) return false;
                }
                return true;
            });
        };
        return new QueryChain(getFiltered());
    }

    static findOne(query = {}) {
        const getOne = async () => {
            const list = await readBlobFile(DB_FILE);
            const item = list.find(item => {
                for (const key in query) {
                    if (item[key] !== query[key]) return false;
                }
                return true;
            });
            return item ? new Contact(item) : null;
        };
        return new QueryChain(getOne(), true);
    }

    static findById(id) {
        const getOne = async () => {
            const list = await readBlobFile(DB_FILE);
            const item = list.find(item => item._id === id);
            return item ? new Contact(item) : null;
        };
        return new QueryChain(getOne(), true);
    }

    static findByIdAndDelete(id) {
        const deleteFn = async () => {
            const list = await readBlobFile(DB_FILE);
            const index = list.findIndex(item => item._id === id);
            if (index > -1) {
                const deleted = list.splice(index, 1)[0];
                await writeBlobFile(DB_FILE, list);
                return new Contact(deleted);
            }
            return null;
        };
        return new QueryChain(deleteFn(), true);
    }

    static async countDocuments(query = {}) {
        const list = await readBlobFile(DB_FILE);
        return list.filter(item => {
            for (const key in query) {
                if (item[key] !== query[key]) return false;
            }
            return true;
        }).length;
    }
}

module.exports = Contact;
