import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import Jwt from 'jsonwebtoken';

jest.mock('../nats-wrapper');

let mongo: MongoMemoryServer;
beforeAll(async () => {
    process.env.JWT_KEY = 'testkey'
    mongo = await MongoMemoryServer.create();
    const mongoUri = await mongo.getUri();
    await mongoose.connect(mongoUri, {});
});

beforeEach(async () => {
    jest.clearAllMocks();
    const collections = await mongoose.connection.db.collections();
    for (const collection of collections) {
        await collection.deleteMany({});
    }
});

afterAll(async () => {
    if (mongo) {
        await mongo.stop();
    }
    await mongoose.connection.close();
});

declare global {
    var signin: (id?: string) => string[];
}

global.signin = (id?: string) => {
    const session = {
        jwt: Jwt.sign({
            id: id || new mongoose.Types.ObjectId().toHexString(),
            email: "test@test.com"
        }, process.env.JWT_KEY!)
    };
    // Take JSON and encode it as base64
    const base64 = Buffer.from( JSON.stringify(session)).toString('base64');

    return [`session=${base64}`];
}