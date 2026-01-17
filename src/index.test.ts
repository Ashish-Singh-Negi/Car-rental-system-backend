import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "./index.js";

describe("POST /auth/signup", () => {
  const SIGNUP_ROUTE = "/auth/signup";

  it("should return 201 status if user signup successfully", async () => {
    const res = await request(app)
      .post(SIGNUP_ROUTE)
      .send({
        username: `Test${new Date().getTime()}`,
        password: "testpassword",
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

    // console.log("TOKEN ", res.body.data.token);

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
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsInVzZXJuYW1lIjoiVGVzdCIsImlhdCI6MTc2ODY0ODg1Mn0.CbSuvsxi2uPlQr7V9Q2c1z0BbOOAHyX0nYWNkaAZ1Mc";

// for Logged in user only
describe("POST /bookings   protected route", async () => {
  const BOOKING_ROUTE = "/bookings";
  const CAR_NAMES = [
    "BMW x3",
    "BMW x5",
    "BMW x7",
    "Mercedes S350d",
    "Mercedes S450 4Matic",
    "Mercedes E200",
    "Mercedes E220d",
    "Honda City",
    "Mahendra XEV9e",
    "Tata curve",
  ];
  const dummeyBookingData = {
    carName: CAR_NAMES[Math.floor(Math.random() * 10)],
    days: Math.ceil(Math.random() * 60),
    rentPerDay: Math.ceil(Math.random() * 15) * 100,
  };

  it("Should return 201 status if booking is created", async () => {
    const res = await request(app)
      .post(BOOKING_ROUTE)
      .set("Authorization", `Bearer ${TOKEN}`)
      .send(dummeyBookingData);

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
  const BID = 35;

  it("should return 200 status and booking data", async () => {
    const res = await request(app)
      .get(`${GET_BOOKING_ROUTE}/${BID}`)
      .set("Authorization", `Bearer ${TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBeTypeOf("number");
    expect(res.body.data.car_name).toBeTypeOf("string");
    expect(res.body.data.days).toBeTypeOf("number");
    expect(res.body.data.rent_per_day).toBeTypeOf("number");
    expect(["booked", "completed", "cancelled"]).toContain(
      res.body.data.status,
    );
    expect(res.body.data.totalCost).toBeTypeOf("number");
  });

  it("should return 200 status and bookings summary", async () => {
    const res = await request(app)
      .get(`${GET_BOOKING_ROUTE}/${BID}?summary=true`)
      .set("Authorization", `Bearer ${TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body.data.userId).toBeTypeOf("number");
    expect(res.body.data.username).toBeTypeOf("string");
    expect(res.body.data.totalBookings).toBeTypeOf("number");
    expect(res.body.data.totalAmountSpent).toBeTypeOf("number");
  });

  it("should return 404 status if booking id not found", async () => {
    const res = await request(app)
      .get(`${GET_BOOKING_ROUTE}/2`)
      .set("Authorization", `Bearer ${TOKEN}`);

    expect(res.status).toBe(404);
    expect(res.body.err.message).toBe("bookingId not found");
  });
});
