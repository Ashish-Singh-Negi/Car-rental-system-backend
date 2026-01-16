import express from "express";
import { errorResponse, successResponse } from "./utils/responses.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma.js";
import { generateToken } from "./utils/generateToken.js";
import { authMiddleware } from "./middleware/authMiddleware.js";

export const app = express();
app.use(express.json());

// all api routes

app.post("/auth/signup", async (req, res) => {
  const { username, password } = req.body;

  console.log("BEFORE PRISMA");
  await prisma.user.findFirst({
    where: {
      id: 108,
    },
  });
  console.log("AFTER PRISMA");

  if (!username || !password) {
    return res.status(400).json(errorResponse("invalid inputs"));
  }

  const usernameExist = await prisma.user.findFirst({
    where: {
      username,
    },
    select: {
      username: true,
    },
  });

  console.log(usernameExist);
  if (usernameExist)
    return res.status(409).json(errorResponse("username already exists"));

  const hashedPass = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      username,
      password: hashedPass,
    },
    omit: {
      password: true,
    },
  });

  res
    .status(201)
    .json(successResponse("User signup successfully", { userId: user.id }));
});

app.post("/auth/login", async (req, res) => {
  const { username, password } = req.body;

  // validate
  if (!username || !password) {
    return res.status(400).json(errorResponse("invalid inputs"));
  }

  // find username in DB
  const user = await prisma.user.findFirst({
    where: {
      username,
    },
  });

  console.log(user);
  if (!user) return res.status(401).json(errorResponse("user does not exist"));

  // check password match or not
  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch)
    return res.status(401).json(errorResponse("incorrect password"));

  // generate token
  const token = generateToken({
    userId: user.id,
    username: user.username,
  });

  res.status(200).json(successResponse("signin successfully", { token }));
});

export function calculateBookingCost(days: number, rentPerday: number) {
  return days * rentPerday;
}

app.post("/bookings", authMiddleware, async (req, res) => {
  const { carName, days, rentPerDay } = req.body;
  console.log(`🚀 ~ { carName, days, rentPerDay }:`, {
    carName,
    days,
    rentPerDay,
  });

  console.log(req.user);

  if (!carName || !days || !rentPerDay)
    return res.status(400).json(errorResponse("invalid inputs"));

  if (days < 0 || days > 365 || rentPerDay < 0 || rentPerDay > 2000)
    return res.status(400).json(errorResponse("invalid inputs"));

  const booking = await prisma.booking.create({
    data: {
      user_id: req.user.userId,
      car_name: carName,
      days: days,
      rent_per_day: rentPerDay,
      status: "Booked",
    },
  });
  console.log("Booking  ", booking);

  const bookingCost = calculateBookingCost(days, rentPerDay);

  res.status(201).json(
    successResponse("Booking created successfully", {
      bookingId: booking.id,
      totalCost: bookingCost,
    })
  );
});

app.get("/bookings/:id", authMiddleware, async (req, res) => {
  const bid = Number(req.params.id);
  const isSummary = Boolean(req.query.summary);

  const booking = await prisma.booking.findFirst({
    where: {
      id: bid,
    },
    omit: {
      user_id: true,
    },
  });
  if (!booking)
    return res.status(404).json(errorResponse("bookingId not found"));

  res.status(200).json(successResponse(`Booking ${bid} found`, booking));
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log("Server is listening at http://localhost:" + PORT);
});
