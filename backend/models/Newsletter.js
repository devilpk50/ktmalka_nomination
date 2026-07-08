const { QueryChain, readBlobFile, writeBlobFile } = require('./blobDb');
const crypto = require('crypto');

const DB_FILE = 'newsletters.json';

class Newsletter {
    constructor(data) {
        this.email = data.email;
        this.subscribedAt = data.subscribedAt ? new Date(data.subscribedAt) : new Date();
        this.active = data.active !== undefined ? data.active : true;
        this.unsubscribedAt = data.unsubscribedAt ? new Date(data.unsubscribedAt) : null;
        this._id = data._id || crypto.randomUUID();
    }

    async save() {
        const list = await readBlobFile(DB_FILE);
        const index = list.findIndex(item => item._id === this._id);
        const cleanData = {
            _id: this._id,
            email: this.email,
            subscribedAt: this.subscribedAt,
            active: this.active,
            unsubscribedAt: this.unsubscribedAt
        };
        if (index > -1) {
            list[index] = cleanData;
        } else {
            // Check unique constraint for email in new subscriptions
            const duplicate = list.find(item => item.email === this.email && item._id !== this._id);
            if (duplicate) {
                const error = new Error('Duplicate key error: email must be unique');
                error.code = 11000;
                throw error;
            }
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
            return item ? new Newsletter(item) : null;
        };
        return new QueryChain(getOne(), true);
    }

    static findById(id) {
        const getOne = async () => {
            const list = await readBlobFile(DB_FILE);
            const item = list.find(item => item._id === id);
            return item ? new Newsletter(item) : null;
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
                return new Newsletter(deleted);
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

module.exports = Newsletter;
