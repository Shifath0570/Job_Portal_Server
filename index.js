const express = require('express');
const dotenv = require('dotenv')
const cors = require('cors')
const { MongoClient, ServerApiVersion } = require('mongodb');
dotenv.config();

const uri = process.env.MONGO_DB_URI;

const app = express()
const port = process.env.PORT


app.use(cors())
app.use(express.json())


const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


async function run() {
  try {
    const db = client.db(process.env.MONGO_DB_NAME)
    const jobCollection = db.collection('jobs')
    const companyCollection = db.collection('company')


    app.post('/api/jobs', async (req, res) => {
      try {
        const job = req.body;
        const result = await jobCollection.insertOne(job);
        res.status(201).send(result);
      } catch (error) {
        res.status(500).send({ message: "Failed to create job", error: error.message });
      }
    });

    app.put('/api/company/profile', async (req, res) => {
      try {
        const profileData = req.body;

        // Upsert operation: Updates existing profile or inserts a new one
        const result = await companyCollection.updateOne(
          { identifier: "company_profile_main" }, // Unique identifier to keep a single profile document
          { 
            $set: {
              ...profileData,
              updatedAt: new Date().toISOString()
            } 
          },
          { upsert: true }
        );

        res.status(200).send({
          success: true,
          message: "Company profile updated successfully!",
          result
        });
      } catch (error) {
        console.error("PUT Error:", error);
        res.status(500).send({ 
          success: false, 
          message: "Error updating company profile", 
          error: error.message 
        });
      }
    });


    // app.get('/api/books', async (req, res) => {
    //   const result = await booksCollection.find().toArray();
    //   res.send(result);
    // })


    // app.get('/api/books/:id', async (req, res) => {
    //   const {id} = req.params;
    //   const result = await booksCollection.findOne({_id: new ObjectId(id)})
    //   res.send(result);
    // })


    // app.patch("/updateBook/:id", async (req, res)=>{
    //   const {id} = req.params
    //   const updateData = req.body

    //   const result = await booksCollection.updateOne(
    //     {_id: new ObjectId(id)},
    //     {$set: updateData}
    //   )
    //   res.send(result)
    // })


    // app.delete("/UserDelete/:id", async(req, res)=>{
    //   const {id} = req.params;
    //   const result = await userCollection.deleteOne({_id: new ObjectId(id)})
    //   res.send(result)
    // })












    await client.connect();
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
  res.send('Job Portal')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})