const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

// Middleware
app.use(cors());
app.use(express.json());
const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res
      .status(401)
      .send({ error: true, message: "unauthorized access" });
  }
  // bearer token
  const token = authorization.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res
        .status(401)
        .send({ error: true, message: "unauthorized access" });
    }
    req.decoded = decoded;
    next();
  });
};

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.etfska8.mongodb.net/?retryWrites=true&w=majority`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const taskCollection = client.db("taskManager").collection("tasks");
    const usersCollection = client.db("taskManager").collection("users");

    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });

      res.send({ token });
    });

    // Add users to the database
    app.post("/adduser", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await usersCollection.findOne(query);

      if (existingUser) {
        return res.send({ message: "user already exists" });
      }

      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    // Add tasks to the database
    app.post("/addTask", verifyJWT, async (req, res) => {
      const task = req.body;
      const result = await taskCollection.insertOne(task);
      res.send(result);
    });

    // Get tasks from the database
    app.get("/tasks", verifyJWT, async (req, res) => {
      const email = req.decoded.email;
      const query = { email: email };
      const result = await taskCollection.find(query).toArray();
      res.send(result);
    });

    // Make tasks complete
    app.patch("/completeTask", verifyJWT, async (req, res) => {
      const id = req.query.id;
      const query = { _id: new ObjectId(id) };
      const update = {
        $set: {
          status: "completed",
        },
      };
      const result = await taskCollection.updateOne(query, update);
      res.send(result);
    });

    // Delete task
    app.delete("/deleteTask", verifyJWT, async (req, res) => {
      const id = req.query.id;
      const query = { _id: new ObjectId(id) };
      const result = await taskCollection.deleteOne(query);
      res.send(result);
    });

    // Update task
    app.patch("/updateTask", verifyJWT, async (req, res) => {
      const id = req.query.id;
      const query = { _id: new ObjectId(id) };
      const update = {
        $set: {
          taskName: req.body.taskName,
          taskDescription: req.body.taskDescription,
        },
      };
      const result = await taskCollection.updateOne(query, update);
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
  res.send("Task Manager in running!");
});

app.listen(port, () => {
  console.log(`Task Manager Server is running on port: ${port}`);
});
