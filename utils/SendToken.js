import jsonwebtoken from "jsonwebtoken";


const cookieOptions={
    maxAge: 15 * 24 * 60 * 60 * 1000,
    sameSite: "none",
    httpOnly: true,
    secure: true,
}
const sendToken = (res, user, code, message) => {
  const token = jsonwebtoken.sign({ _id: user._id }, process.env.JWT_SECRET);

  return res
    .status(code)
    .cookie("chat_token", token,cookieOptions)
    .json({
      sucess:true,
      token,
      message,
      user,
    });
};

export { sendToken,cookieOptions};
