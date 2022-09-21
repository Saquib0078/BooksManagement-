const UserModel = require("../Models/UserModel.js");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const validation= require("../validation/validation")



const CreateUser = async (req, res) => {
  try {
    let data = req.body;
  
    if (Object.keys(data).length == 0)
      return res
        .status(400)
        .send({ status: false, msg: "Input Should not be Empty" });
    if (!data.title)
      return res.status(400).send({ status: false, msg: "title is mandatory" });
    if (!data.phone)
      return res.status(400).send({ status: false, msg: "phone is mandatory" });
    if (!validateMobile(data.phone))
      return res.status(400).send({ status: false, msg: "phone is not valid" });
    if (!data.name)
      return res.status(400).send({ status: false, msg: "name is mandatory" });
    if (!validation.name(data.name))
      return res.status(400).send({ status: false, msg: "name is not valid" });
    if (!data.email)
      return res.status(400).send({ status: false, msg: "email is mandatory" });
    if (!validator.isEmail(data.email))
      return res.status(400).send({ status: false, msg: "email is not valid" });
    if (!data.password)
      return res
        .status(400)
        .send({ status: false, msg: "password is mandatory" });
    if (validator.isStrongPassword(data.password))
      return res
        .status(400)
        .send({ status: false, msg: "password is not valid" });

    let UniqueDetails = await UserModel.findOne({
      email: data.email,
      phone: data.phone,
    });
    if (UniqueDetails)
      return res
        .status(400)
        .send({ status: false, msg: "Email & Phone must be Unique" });

    let savedUser = await UserModel.create(data);
    return res.status(201).send({ status: true, data: savedUser });
  } catch (error) {
    return res.status(500).send(error.message);
  }
};

const LoginUser = async (req, res) => {
  let data = req.body;
  if (Object.keys(data).length == 0)
    return res.status(400).send("Input is Missing");
  if (!data.email)
    return res.status(400).send({ status: false, msg: "email is mandatory" });
  if (!validator.isEmail(data.email))
    return res.status(400).send({ status: false, msg: "email is not valid" });
  if (!data.password)
    return res
      .status(400)
      .send({ status: false, msg: "password is mandatory" });
  let User = await UserModel.findOne({
    email: data.email,
    password: data.password,
  });
  if (!User)
    return res.status(400).send({ status: false, msg: "No user Found" });
  let token = jwt.sign({ UserId: User._id.toString() }, "group26project-3");
  return res.send({ status: true, msg: token });
};

module.exports.CreateUser = CreateUser;
module.exports.LoginUser = LoginUser;
