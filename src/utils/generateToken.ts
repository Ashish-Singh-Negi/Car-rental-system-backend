import jwt from "jsonwebtoken";

function generateToken(data: { userId: number; username: string }) {
  const token = jwt.sign(
    {
      userId: data.userId,
      username: data.username,
    },
    process.env.JWT_SECRET || "JWT_SECRET!"
  );

  return token;
}

export { generateToken };
