const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json())

// mongodb codes

// Username: saadibnesaifullah051
// Pass: 1ZC7E0UDLeILPhuK


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xgkcrfh.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const serviceCollection = client.db('carServicing').collection('services');

    // getting all data from server
    app.get('/services', async (req, res) => {
        const cursor = serviceCollection.find();
        const result = await cursor.toArray();
        res.send(result);
    })

    // getting specific one data from server
    app.get('/services/:id', async (req, res) => {
      const id = req.params.id;
      const  query = { _id : new ObjectId(id) };
      const options = {
      // to get some data from lots of data. if need then have to write 1 if not then 0
      projection: { title: 1, price: 1, service_id: 1 },
    };
      const result = await serviceCollection.findOne(query, options);
      res.send(result);
    })



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Car Servicing server is running.......')
})

app.listen(port, ()=> {
    console.log(`Car server is running, ${port}`)
})