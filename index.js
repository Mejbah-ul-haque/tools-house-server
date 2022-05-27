const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port =process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.orz1c.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if(!authHeader){
    return res.status(401).send({message: 'UnAuthorized access'});
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, decoded) {
    if(err){
      return res.status(403).send({message: 'Forbidden access'})
    }
    req.decoded = decoded;
    next();
  })
}


async function run() {
  try {
    await client.connect();
    const serviceCollection = client.db('tools_house').collection('services');
    const reviewCollection = client.db('tools_house').collection('reviews');
    const purchaseCollection = client.db('tools_house').collection('purchases');
    const blogCollection = client.db('tools_house').collection('blogs');
    const userCollection = client.db('tools_house').collection('users');
    
    // Reviews
    app.get('/review', async(req, res)=>{
      const query ={};
      const cursor = reviewCollection.find(query);
      const reviews = await cursor.toArray();
      res.json(reviews);
    })
    
    
    // Blog
    app.get('/blog', async(req, res)=>{
      const query ={};
      const cursor = blogCollection.find(query);
      const services = await cursor.toArray();
      res.json(services);
    })
    
    app.get('/blog/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await blogCollection.findOne(query);
      res.json(result);
  });
  
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
  
  app.put('/user/:email', async (req, res) => {
    const email = req.params.email;
    const user = req.body;
    const filter = {email: email};
    const options = {upsert: true};
    const updateDoc = {
      $set: user,
    };
    const result = await userCollection.updateOne(filter, updateDoc, options);
    const token = jwt.sign({email: email}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'})
    res.json({result, token});
  })
  
  // app.get('/available', async (req, res) =>{
  //   const quantity = req.query.quantity;
  //   const services = await serviceCollection.find().toArray();
  //   const query = {quantity: totalQuantity}
  //   const purchases = await purchaseCollection.find(query).toArray();
    
  //   services.forEach(service => {
  //     const servicePurchases = purchases.filter(purchase =>purchase.toolsName === service.name);
  //     const purchaseQuantity = servicePurchases.map(purchase=>purchase.quantity);
  //     const available = service.availableQuantity.filter(quantity =>!purchaseQuantity.includes(quantity));
  //     service.availableQuantity = available;
  //   })
  //   res.json(purchases);
  // })
  
  app.get('/purchase', verifyJWT, async (req, res) =>{
    const userEmail = req.query.userEmail;    
    const decodedEmail = req.decoded.email;
    if(userEmail === decodedEmail){
      const query ={userEmail: userEmail}
      const purchases = await purchaseCollection.find(query).toArray();
      return res.json(purchases);
    }
    else{
      return res.status(403).send({message: 'forbidden access'});
    }
    
    
  })
  
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