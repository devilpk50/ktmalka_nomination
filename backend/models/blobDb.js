const { put, list } = require('@vercel/blob');

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

class QueryChain {
    constructor(dataPromise, isSingle = false) {
        this.dataPromise = dataPromise;
        this.isSingle = isSingle;
        this._sort = null;
        this._skip = 0;
        this._limit = null;
    }

    sort(sortObj) {
        this._sort = sortObj;
        return this;
    }

    skip(n) {
        this._skip = n;
        return this;
    }

    limit(n) {
        this._limit = n;
        return this;
    }

    lean() {
        return this;
    }

    async then(resolve, reject) {
        try {
            let data = await this.dataPromise;
            
            if (this.isSingle) {
                resolve(data);
                return;
            }
            
            if (this._sort) {
                const sortKeys = Object.keys(this._sort);
                if (sortKeys.length > 0) {
                    const key = sortKeys[0];
                    const direction = this._sort[key];
                    data = [...data].sort((a, b) => {
                        const valA = a[key];
                        const valB = b[key];
                        if (valA < valB) return -1 * direction;
                        if (valA > valB) return 1 * direction;
                        return 0;
                    });
                }
            }
            
            if (this._skip > 0) {
                data = data.slice(this._skip);
            }
            
            if (this._limit !== null) {
                data = data.slice(0, this._limit);
            }

            resolve(data);
        } catch (err) {
            reject(err);
        }
    }
}

async function readBlobFile(filename) {
    if (!BLOB_TOKEN) {
        console.warn(`BLOB_READ_WRITE_TOKEN not set. Returning empty array for database ${filename}.`);
        return [];
    }
    try {
        const { blobs } = await list({ prefix: `db/${filename}`, token: BLOB_TOKEN });
        if (blobs.length === 0) return [];
        
        // Match exact pathname if there are multiple suffixes, or fallback to the first matching prefix
        const matched = blobs.find(b => b.pathname === `db/${filename}`) || blobs[0];
        
        const response = await fetch(matched.url);
        if (!response.ok) return [];
        return await response.json();
    } catch (err) {
        console.error(`Error reading ${filename} from Vercel Blob:`, err);
        return [];
    }
}

async function writeBlobFile(filename, data) {
    if (!BLOB_TOKEN) {
        console.error('BLOB_READ_WRITE_TOKEN is not set. Cannot save database array.');
        return;
    }
    try {
        await put(`db/${filename}`, JSON.stringify(data), {
            access: 'public',
            addRandomSuffix: false,
            token: BLOB_TOKEN
        });
    } catch (err) {
        console.error(`Error writing ${filename} to Vercel Blob:`, err);
        throw err;
    }
}

module.exports = {
    QueryChain,
    readBlobFile,
    writeBlobFile
};
