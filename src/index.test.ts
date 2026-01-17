import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "./index.js";

describe("POST /auth/signup", () => {
  const SIGNUP_ROUTE = "/auth/signup";

  it("should return 201 status if user signup successfully", async () => {
    const res = await request(app)
      .post(SIGNUP_ROUTE)
      .send({
        username: `Test ${Math.floor(Math.random() * 1000)}`,
        password: "testpass",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.message).toBe("User signup successfully");
  });

  it("should return 400 status if inputs are not provided", async () => {
    const res = await request(app).post(SIGNUP_ROUTE).send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.err.message).toBe("invalid inputs");
  });

  it("should return 409 status if username already exists", async () => {
    const res = await request(app).post(SIGNUP_ROUTE).send({
      username: "Test",
      password: "test",
    });

    expect(res.statusCode).toBe(409);
    expect(res.body.err.message).toBe("username already exists");
  });
});

describe("POST /auth/login", async () => {
  const LOGIN_ROUTE = "/auth/login";

  it("Should return 200 status if signin successfully", async () => {
    const res = await request(app).post(LOGIN_ROUTE).send({
      username: "Test",
      password: "test",
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.message).toBe("signin successfully");
    expect(res.body.data.token).toBeTypeOf("string");
  });

  it("Should return 400 status if inputs are not provided", async () => {
    const res = await request(app).post(LOGIN_ROUTE).send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.err.message).toBe("invalid inputs");
  });

  it("Should return 401 status if user does not exist", async () => {
    const res = await request(app).post(LOGIN_ROUTE).send({
      username: "Testg",
      password: "testg",
    });

    expect(res.statusCode).toBe(401);
    expect(res.body.err.message).toBe("user does not exist");
  });

  it("Should return 401 status if password incorrect", async () => {
    const res = await request(app).post(LOGIN_ROUTE).send({
      username: "Test",
      password: "incorrectPassword",
    });

    expect(res.statusCode).toBe(401);
    expect(res.body.err.message).toBe("incorrect password");
  });
});

const TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEwOCwidXNlcm5hbWUiOiJUZXN0IiwiaWF0IjoxNzY4NTQ1NjUyfQ.Wsb96RmWcUkgcm-1lbSCAMT7Mw7v6EZ_j1lkZFKsG2E";

// for Logged in user only
describe("POST /bookings   protected route", async () => {
  const BOOKING_ROUTE = "/bookings";

  it("Should return 201 status if booking is created", async () => {
    const res = await request(app)
      .post(BOOKING_ROUTE)
      .set("Authorization", `Bearer ${TOKEN}`)
      .send({
        carName: "Honda City",
        days: 3,
        rentPerDay: 1500,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toBe("Booking created successfully");
    expect(res.body.data.bookingId).toBeTypeOf("number");
    expect(res.body.data.totalCost).toBeTypeOf("number");
  });

  it("should return 401 status if authorization header is invalid or missing", async () => {
    const res = await request(app).post(BOOKING_ROUTE).send({});

    expect(res.statusCode).toBe(401);
    expect(res.body.err.message).toBe("unauthorized");
  });

  it("Should return 400 status if inputs are not provided", async () => {
    const res = await request(app)
      .post(BOOKING_ROUTE)
      .set("Authorization", `Bearer ${TOKEN}`)
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.err.message).toBe("invalid inputs");
  });

  it("should return 400 status if days are more then 365 days", async () => {
    const res = await request(app)
      .post(BOOKING_ROUTE)
      .set("Authorization", `Bearer ${TOKEN}`)
      .send({
        carName: "Honda City",
        days: 366,
        rentPerDay: 1500,
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.err.message).toBe("invalid inputs");
  });

  it("should return 400 status if rent per day is more then 2000", async () => {
    const res = await request(app)
      .post(BOOKING_ROUTE)
      .set("Authorization", `Bearer ${TOKEN}`)
      .send({
        carName: "Honda City",
        days: 366,
        rentPerDay: 2001,
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.err.message).toBe("invalid inputs");
  });
});

describe("GET /bookings/:id", async () => {
  const GET_BOOKING_ROUTE = "/bookings";

  it("should return 200 status and booking data", async () => {
    const res = await request(app)
      .get(`${GET_BOOKING_ROUTE}/1`)
      .set("Authorization", `Bearer ${TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      data: {
        id: expect.any(Number),
        car_name: expect.any(String),
        days: expect.any(String),
        rent_per_day: expect.any(Number),
        status: expect.stringMatching(/booked|completed|cancelled/),
        totalCost: expect.any(Number),
      },
    });
  });

  it("should return 200 status and bookings summary", async () => {
    const res = await request(app)
      .get(`${GET_BOOKING_ROUTE}/1?summary=true`)
      .set("Authorization", `Bearer ${TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      data: {
        userId: expect.any(Number),
        username: expect.any(String),
        totalBookings: expect.any(Number),
        totalAmountSpent: expect.any(Number),
      },
    });
  });

  it("should return 404 status if booking id not found", async () => {
    const res = await request(app)
      .get(`${GET_BOOKING_ROUTE}/2`)
      .set("Authorization", `Bearer ${TOKEN}`);

    expect(res.status).toBe(404);
    expect(res.body.err.message).toBe("bookingId not found");
  });
});
