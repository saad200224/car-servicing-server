const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const {
  MongoClient,
  ServerApiVersion,
  ObjectId,
  CURSOR_FLAGS,
} = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(
  cors({
    origin: [
      // "http://localhost:5173",
      // "http://localhost:5174",
      "https://cars-doctor-61065.web.app",
      "https://cars-doctor-61065.firebaseapp.com",
    ],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// mongodb codes

// Username: saadibnesaifullah051
// Pass: 1ZC7E0UDLeILPhuK

// ACCESS_TOKEN_SECRET=c1b00c0228bceafd05c309819a517df92400fb895ff2dced00246f009b56a53500cf9ff585837eb58425fc32c86342283cef7980b9f7ded4ae91360ff8ca43cc

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xgkcrfh.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// middlewares

const logger = async (req, res, next) => {
  console.log("called", req.hostname, req.originalUrl);
  next();
};

const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token;
  console.log("verify token", token);
  // error
  if (!token) {
    return res.status(401).send({ message: "Unauthorized." });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      console.log(err);
      return res.status(401).send({ message: "Unauthorized." });
    }
    // if token is valid
    console.log("value in verify token", decoded);
    req.user = decoded;
    next();
  });
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const serviceCollection = client.db("carServicing").collection("services");
    const bookingCollection = client.db("carServicing").collection("bookings");

    // auth related api
    // when login
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });

      res
        .cookie("token", token, {
          httpOnly: true,
          secure: true,
          sameSite: "none",
        })
        .send({ success: true });
    });

    // when logout and clear cookie
    app.post("/logout", async (req, res) => {
      const user = req.body;
      console.log("logging out", user);
      res.clearCookie("token", { maxAge: 0 }).send({ success: true });
    });

    // service related api
    // getting all data from server
    app.get("/services", logger, async (req, res) => {
      const cursor = serviceCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // getting specific one data from server
    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      const options = {
        // to get some data from lots of data. if need then have to write 1 if not then 0
        projection: { title: 1, price: 1, service_id: 1, img: 1 },
      };

      const result = await serviceCollection.findOne(query, options);
      res.send(result);
    });

    // bookings related api

    app.get("/bookings", logger, verifyToken, async (req, res) => {
      console.log(req.query.email);
      // console.log('tok tok token', req.cookies)
      console.log("user in the valid token", req.user);
      if (req.query.email !== req.user.email) {
        return res.status(403).send({ message: "Forbidden Access." });
      }
      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email };
      }
      const result = await bookingCollection.find().toArray();
      res.send(result);
    });

    app.post("/bookings", async (req, res) => {
      const booking = req.body;
      const result = await bookingCollection.insertOne(booking);
      res.send(result);
      console.log(booking);
    });

    app.patch("/bookings/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedBooking = req.body;
      console.log(updatedBooking);
      const updateDoc = {
        $set: {
          status: updatedBooking.status,
        },
      };
      const result = await bookingCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.delete("/bookings/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookingCollection.deleteOne(query);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Car Servicing server is running.......");
});

app.listen(port, () => {
  console.log(`Car server is running, ${port}`);
});
