import request from 'supertest';
import { app } from '../../app';

it('fails when an incorrect password is supplied', async () => {
    await request(app)
        .post('/api/users/signup')
        .send({
            email: 'test@test.com',
            password: 'testpassword'
        })
        .expect(201);

    return request(app)
        .post('/api/users/signin')
        .send({
            email: 'test@test.com',
            password: 'wrongpassword'
        })
        .expect(400);
});

it('responds with a cookie when given valid creds', async () => {
    await request(app)
        .post('/api/users/signup')
        .send({
            email: 'test@test.com',
            password: 'testpassword'
        })
        .expect(201);

    const response = await request(app)
        .post('/api/users/signin')
        .send({
            email: 'test@test.com',
            password: 'testpassword'
        })
        .expect(200);

    expect(response.get('Set-Cookie')).toBeDefined();
});

it('fails when an email that does not exist is supplied', async () => {
    return request(app)
        .post('/api/users/signin')
        .send({
            email: 'test@doesnotexist.com',
            password: 'pass1234'
        })
        .expect(400);
});
