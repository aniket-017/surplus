import jwt from "jsonwebtoken";

const userSelect = {
  id: true,
  email: true,
  name: true,
  avatarUrl: true,
  role: true,
  address: true,
  createdAt: true,
};

export function formatUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    role: user.role ? user.role.toLowerCase() : null,
    address: user.address ?? null,
    createdAt: user.createdAt,
  };
}

export function parseUserAddress(raw) {
  if (raw === undefined) {
    return undefined;
  }

  if (raw === null) {
    return null;
  }

  let parsed = raw;
  if (typeof raw === "string") {
    parsed = JSON.parse(raw);
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid address");
  }

  const address = {
    address: parsed.address ? String(parsed.address).trim() : null,
    city: String(parsed.city || "").trim(),
    state: String(parsed.state || "").trim(),
    pincode: String(parsed.pincode || "").trim(),
  };

  if (!address.city || !address.state || !address.pincode) {
    throw new Error("City, state, and pincode are required");
  }

  return address;
}

export function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role ? user.role.toLowerCase() : null,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function setAuthCookie(res, user) {
  const token = signToken(user);

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return token;
}

export function clearAuthCookie(res) {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });
}

export { userSelect };
