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

    app.get('/api/jobs', async (req, res) => {
      try {
        const jobs = await jobCollection.find().toArray();
        res.status(200).send(jobs);
      } catch (error) {
        res.status(500).send({
          message: "Failed to fetch jobs",
          error: error.message
        });
      }
    });

    app.put('/api/company/profile/:email', async (req, res) => {
      try {
        const { email } = req.params;
        const profileData = req.body;

        if (!profileData || Object.keys(profileData).length === 0) {
          return res.status(400).send({
            success: false,
            message: "Request body cannot be empty",
          });
        }

        // Upsert operation: Updates existing profile matching the email or inserts a new one
        const result = await companyCollection.updateOne(
          { email }, // Filter by the target company email route parameter
          {
            $set: {
              ...profileData,
              email,
              updatedAt: new Date().toISOString(),
            },
          },
          { upsert: true }
        );

        res.status(200).send({
          success: true,
          message: "Company profile updated successfully!",
          result,
        });
      } catch (error) {
        console.error("PUT Error:", error);
        res.status(500).send({
          success: false,
          message: "Error updating company profile",
          error: error.message,
        });
      }
    });


    app.get('/api/company/profile/:email', async (req, res) => {
      try {
        const { email } = req.params;

        if (!email) {
          return res.status(400).send({
            success: false,
            message: "Email parameter is required",
          });
        }

        // Find the company profile document matching the user's email
        const result = await companyCollection.findOne({ email });

        if (!result) {
          return res.status(404).send({
            success: false,
            message: "Company profile not found",
          });
        }

        res.status(200).send(result);
      } catch (error) {
        console.error("GET Error:", error);
        res.status(500).send({
          success: false,
          message: "Error fetching company profile",
          error: error.message,
        });
      }
    });






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