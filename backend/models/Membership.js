const { QueryChain, readBlobFile, writeBlobFile } = require('./blobDb');
const crypto = require('crypto');

const DB_FILE = 'memberships.json';

class Membership {
    constructor(data) {
        this.fullName = data.fullName;
        this.dob = data.dob ? new Date(data.dob) : null;
        this.gender = data.gender;
        this.email = data.email;
        this.phone = data.phone;
        this.address = data.address;
        this.school = data.school;
        this.level = data.level;
        this.year = data.year;
        this.reason = data.reason;
        this.submittedAt = data.submittedAt ? new Date(data.submittedAt) : new Date();
        this.status = data.status || 'pending';
        this._id = data._id || crypto.randomUUID();
    }

    async save() {
        const list = await readBlobFile(DB_FILE);
        const index = list.findIndex(item => item._id === this._id);
        const cleanData = {
            _id: this._id,
            fullName: this.fullName,
            dob: this.dob,
            gender: this.gender,
            email: this.email,
            phone: this.phone,
            address: this.address,
            school: this.school,
            level: this.level,
            year: this.year,
            reason: this.reason,
            submittedAt: this.submittedAt,
            status: this.status
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
            return item ? new Membership(item) : null;
        };
        return new QueryChain(getOne(), true);
    }

    static findById(id) {
        const getOne = async () => {
            const list = await readBlobFile(DB_FILE);
            const item = list.find(item => item._id === id);
            return item ? new Membership(item) : null;
        };
        return new QueryChain(getOne(), true);
    }

    static findByIdAndUpdate(id, update, options = {}) {
        const updateFn = async () => {
            const list = await readBlobFile(DB_FILE);
            const index = list.findIndex(item => item._id === id);
            if (index > -1) {
                const item = list[index];
                const fields = update.$set || update;
                Object.assign(item, fields);
                await writeBlobFile(DB_FILE, list);
                return new Membership(item);
            }
            return null;
        };
        return new QueryChain(updateFn(), true);
    }

    static findByIdAndDelete(id) {
        const deleteFn = async () => {
            const list = await readBlobFile(DB_FILE);
            const index = list.findIndex(item => item._id === id);
            if (index > -1) {
                const deleted = list.splice(index, 1)[0];
                await writeBlobFile(DB_FILE, list);
                return new Membership(deleted);
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

module.exports = Membership;
