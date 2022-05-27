const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port =process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.orz1c.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {
  try {
    await client.connect();
    const serviceCollection = client.db('tools_house').collection('services');
    const reviewCollection = client.db('tools_house').collection('reviews');
    const purchaseCollection = client.db('tools_house').collection('purchases');
    
    // Reviews
    app.get('/review', async(req, res)=>{
      const query ={};
      const cursor = reviewCollection.find(query);
      const reviews = await cursor.toArray();
      res.json(reviews);
    })
    
    
    // Tools/Services
    app.get('/service', async(req, res)=>{
      const query ={};
      const cursor = serviceCollection.find(query);
      const services = await cursor.toArray();
      res.json(services);
    })
    
    app.get('/service/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await serviceCollection.findOne(query);
      res.json(result);
  });
  
  app.post("/purchase", async (req, res)=>{
    const purchase = req.body;
    const query = {toolsName: purchase.toolsName, userEmail: purchase.userEmail}
    const exists = await purchaseCollection.findOne(query);
    if (exists) {
      return res.json({success: false, purchase: exists})
    }
    const result = await purchaseCollection.insertOne(purchase);
    return res.json({success: true, result});
  })
    
  }
  finally {
    
  }
  
}

run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Hello from Tools House!')
})

app.listen(port, () => {
  console.log(`Tools House app listening on port ${port}`)
})