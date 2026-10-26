const express = require('express');
const dotenv = require('dotenv')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
    const seekerCollection = db.collection('seeker')
    const savejobCollection = db.collection('saveJob')
    const applicationCollection = db.collection('applications')
    const userCollection = db.collection('user')




    app.get('/api/users', async (req, res) => {
      try {
        const users = await userCollection.find({}).toArray();

        res.status(200).send({
          success: true,
          count: users.length,
          users,
        });
      } catch (error) {
        console.error("GET Users Error:", error);
        res.status(500).send({
          success: false,
          message: "Failed to fetch users",
          error: error.message,
        });
      }
    });




    app.put('/api/users/:id', async (req, res) => {
      try {
        const { id } = req.params;
        const { name, email, role, status } = req.body;

        // Validate if the provided ID is a valid MongoDB ObjectId
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({
            success: false,
            message: "Invalid user ID format",
          });
        }

        const query = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: {
            ...(name && { name }),
            ...(email && { email }),
            ...(role && { role }),
            ...(status && { status }),
            updatedAt: new Date(),
          },
        };

        const result = await userCollection.updateOne(query, updateDoc);

        if (result.matchedCount === 0) {
          return res.status(404).send({
            success: false,
            message: "User not found",
          });
        }

        res.status(200).send({
          success: true,
          message: "User profile updated successfully",
          modifiedCount: result.modifiedCount,
        });
      } catch (error) {
        console.error("UPDATE User Error:", error);
        res.status(500).send({
          success: false,
          message: "Failed to update user profile",
          error: error.message,
        });
      }
    });




    app.delete('/api/users/:id', async (req, res) => {
      try {
        const { id } = req.params;

        // Validate if the provided ID is a valid MongoDB ObjectId
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({
            success: false,
            message: "Invalid user ID format",
          });
        }

        const query = { _id: new ObjectId(id) };
        const result = await userCollection.deleteOne(query);

        // Check if the user actually existed in the database
        if (result.deletedCount === 0) {
          return res.status(404).send({
            success: false,
            message: "User not found",
          });
        }

        res.status(200).send({
          success: true,
          message: "User deleted successfully",
          deletedCount: result.deletedCount,
        });
      } catch (error) {
        console.error("DELETE User Error:", error);
        res.status(500).send({
          success: false,
          message: "Failed to delete user",
          error: error.message,
        });
      }
    });




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


    app.delete('/api/jobs/:id', async (req, res) => {
      try {
        const { id } = req.params;

        // Validate if the provided ID is a valid MongoDB ObjectId
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({
            success: false,
            message: "Invalid job ID format",
          });
        }

        const query = { _id: new ObjectId(id) };
        const result = await jobCollection.deleteOne(query);

        // Check if the job actually existed in the database
        if (result.deletedCount === 0) {
          return res.status(404).send({
            success: false,
            message: "Job not found",
          });
        }

        res.status(200).send({
          success: true,
          message: "Job deleted successfully",
          deletedCount: result.deletedCount,
        });
      } catch (error) {
        console.error("DELETE Job Error:", error);
        res.status(500).send({
          success: false,
          message: "Failed to delete job",
          error: error.message,
        });
      }
    });




    app.get('/api/jobs/:status', async (req, res) => {
      try {
        const { status } = req.params;

        if (!status) {
          return res.status(400).send({
            success: false,
            message: "Status parameter is required",
          });
        }

        const query = {};

        if (status.toLowerCase() !== "all") {
          query.status = { $regex: new RegExp(`^${status}$`, "i") };
        }

        const jobs = await jobCollection.find(query).toArray();

        res.status(200).send({
          success: true,
          count: jobs.length,
          jobs,
        });
      } catch (error) {
        console.error("GET Company Jobs Error:", error);
        res.status(500).send({
          success: false,
          message: "Error fetching company jobs",
          error: error.message,
        });
      }
    });


    app.patch('/api/jobs/:id/status', async (req, res) => {
      try {
        const { id } = req.params;
        const { status } = req.body; // Expects { status: "Active" } or { status: "Closed" }

        // Validate ObjectId
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({
            success: false,
            message: "Invalid job ID format",
          });
        }

        // Validate status value
        if (!status || !["Active", "Closed"].includes(status)) {
          return res.status(400).send({
            success: false,
            message: "Valid status ('Active' or 'Closed') is required in request body",
          });
        }

        const query = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: { status: status },
        };

        const result = await jobCollection.updateOne(query, updateDoc);

        if (result.matchedCount === 0) {
          return res.status(404).send({
            success: false,
            message: "Job not found",
          });
        }

        res.status(200).send({
          success: true,
          message: `Job status updated to ${status} successfully`,
          modifiedCount: result.modifiedCount,
        });
      } catch (error) {
        console.error("Update Job Status Error:", error);
        res.status(500).send({
          success: false,
          message: "Failed to update job status",
          error: error.message,
        });
      }
    });



    app.get('/api/jobs/company/:email', async (req, res) => {
      try {
        const { email } = req.params;

        if (!email) {
          return res.status(400).send({
            success: false,
            message: "Email parameter is required",
          });
        }

        // Find all jobs posted under companyEmail
        const jobs = await jobCollection.find({ companyEmail: email }).toArray();

        res.status(200).send(jobs);
      } catch (error) {
        console.error("GET Company Jobs Error:", error);
        res.status(500).send({
          success: false,
          message: "Error fetching company jobs",
          error: error.message,
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





    app.get('/api/company/all', async (req, res) => {
      try {
        const companies = await companyCollection.find({}).toArray();

        res.status(200).send({
          success: true,
          count: companies.length,
          data: companies,
        });
      } catch (error) {
        console.error("GET All Error:", error);
        res.status(500).send({
          success: false,
          message: "Error fetching all company profiles",
          error: error.message,
        });
      }
    });




    app.delete('/api/company/:id', async (req, res) => {
      try {
        const { id } = req.params;

        // Validate if the provided ID is a valid MongoDB ObjectId
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({
            success: false,
            message: "Invalid company ID format",
          });
        }

        const query = { _id: new ObjectId(id) };
        const result = await companyCollection.deleteOne(query);

        // Check if the company actually existed in the database
        if (result.deletedCount === 0) {
          return res.status(404).send({
            success: false,
            message: "Company profile not found",
          });
        }

        res.status(200).send({
          success: true,
          message: "Company profile deleted successfully",
          deletedCount: result.deletedCount,
        });
      } catch (error) {
        console.error("DELETE Company Error:", error);
        res.status(500).send({
          success: false,
          message: "Failed to delete company profile",
          error: error.message,
        });
      }
    });




    app.put('/api/seeker/profile/:email', async (req, res) => {
      try {
        const { email } = req.params;
        const profileData = req.body;

        if (!profileData || Object.keys(profileData).length === 0) {
          return res.status(400).send({
            success: false,
            message: "Request body cannot be empty",
          });
        }

        // Strip out _id if present to prevent MongoDB immutable field modification errors
        const { _id, ...cleanData } = profileData;

        // Upsert operation: Updates existing profile matching the email or inserts a new one
        const result = await seekerCollection.updateOne(
          { email },
          {
            $set: {
              ...cleanData,
              email,
              updatedAt: new Date().toISOString(),
            },
          },
          { upsert: true }
        );

        res.status(200).send({
          success: true,
          message: "Seeker profile and resume updated successfully!",
          result,
        });
      } catch (error) {
        console.error("PUT Seeker Profile Error:", error);
        res.status(500).send({
          success: false,
          message: "Error updating seeker profile",
          error: error.message,
        });
      }
    });


    app.get('/api/seeker/all', async (req, res) => {
      try {
        const seekers = await seekerCollection.find({}).toArray();

        res.status(200).send({
          success: true,
          count: seekers.length,
          data: seekers,
        });
      } catch (error) {
        console.error("GET All Seekers Error:", error);
        res.status(500).send({
          success: false,
          message: "Error fetching all job seekers",
          error: error.message,
        });
      }
    });




    app.delete('/api/seeker/:id', async (req, res) => {
      try {
        const { id } = req.params;

        // Validate if the provided ID is a valid MongoDB ObjectId
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({
            success: false,
            message: "Invalid job seeker ID format",
          });
        }

        const query = { _id: new ObjectId(id) };
        const result = await seekerCollection.deleteOne(query);

        // Check if the seeker actually existed in the database
        if (result.deletedCount === 0) {
          return res.status(404).send({
            success: false,
            message: "Job seeker profile not found",
          });
        }

        res.status(200).send({
          success: true,
          message: "Job seeker profile deleted successfully",
          deletedCount: result.deletedCount,
        });
      } catch (error) {
        console.error("DELETE Seeker Error:", error);
        res.status(500).send({
          success: false,
          message: "Failed to delete job seeker profile",
          error: error.message,
        });
      }
    });



    app.get('/api/seeker/profile/:email', async (req, res) => {
      try {
        const { email } = req.params;

        if (!email) {
          return res.status(400).send({
            success: false,
            message: "Email parameter is required",
          });
        }

        // Find the seeker profile document matching the user's email
        const result = await seekerCollection.findOne({ email });

        if (!result) {
          return res.status(404).send({
            success: false,
            message: "Seeker profile not found",
          });
        }

        res.status(200).send({
          success: true,
          ...result,
        });
      } catch (error) {
        console.error("GET Seeker Profile Error:", error);
        res.status(500).send({
          success: false,
          message: "Error fetching seeker profile",
          error: error.message,
        });
      }
    });



    app.post('/api/savejob', async (req, res) => {
      try {
        const jobData = req.body;
        const { userEmail } = jobData;
        const jobId = jobData._id || jobData.id || jobData.originalJobId;

        if (!userEmail) {
          return res.status(400).send({
            success: false,
            message: "User email is required to save a job",
          });
        }

        if (!jobId) {
          return res.status(400).send({
            success: false,
            message: "Job ID is required",
          });
        }

        // Check if the user has already saved this job to prevent duplicates
        const existingSave = await savejobCollection.findOne({
          userEmail: userEmail,
          $or: [{ _id: jobId }, { id: jobId }, { originalJobId: jobId }],
        });

        if (existingSave) {
          return res.status(200).send({
            success: true,
            message: "Job is already saved in your dashboard",
            data: existingSave,
          });
        }

        // Remove client-side _id if it's causing duplicate key collisions, 
        // letting MongoDB generate a clean unique _id for the saved collection record.
        const { _id, ...cleanJobData } = jobData;

        const result = await savejobCollection.insertOne({
          ...cleanJobData,
          id: jobId,
        });

        res.status(201).send({
          success: true,
          message: "Job saved successfully",
          result,
        });
      } catch (error) {
        console.error("Save Job Error:", error);
        res.status(500).send({
          success: false,
          message: "Failed to save job",
          error: error.message,
        });
      }
    });


    app.get('/api/savejob', async (req, res) => {
      try {
        const { email } = req.query;

        const query = email ? { userEmail: email } : {};
        const savedJobs = await savejobCollection.find(query).toArray();

        res.status(200).send({
          success: true,
          count: savedJobs.length,
          jobs: savedJobs,
        });
      } catch (error) {
        console.error("Get Saved Jobs Error:", error);
        res.status(500).send({
          success: false,
          message: "Failed to fetch saved jobs",
          error: error.message,
        });
      }
    });



    app.post('/api/applications', async (req, res) => {
      try {
        const result = await applicationCollection.insertOne({
          ...req.body,
          createdAt: new Date(),
        });
        res.status(201).send({ success: true, insertedId: result.insertedId });
      } catch (error) {
        res.status(500).send({ success: false, error: error.message });
      }
    });


    app.get('/api/application/all', async (req, res) => {
      try {
        const applications = await applicationCollection.find({}).toArray();

        res.status(200).send({
          success: true,
          count: applications.length,
          data: applications,
        });
      } catch (error) {
        console.error("GET All Applications Error:", error);
        res.status(500).send({
          success: false,
          message: "Error fetching all job applications",
          error: error.message,
        });
      }
    });





    app.patch("/api/applicants/:applicantId/status", async (req, res) => {
  try {
    const { applicantId } = req.params;
    const { status } = req.body;

    // Validate if the ID is a valid MongoDB ObjectId
    if (!ObjectId.isValid(applicantId)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid applicant ID format" 
      });
    }

    // Update the status in the database
    const result = await applicationCollection.updateOne(
      { _id: new ObjectId(applicantId) },
      { 
        $set: { 
          status: status, 
          updatedAt: new Date() 
        } 
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Applicant not found" 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: "Application status updated successfully" 
    });
  } catch (error) {
    console.error("Error updating applicant status:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});




    app.delete('/api/application/:id', async (req, res) => {
      try {
        const { id } = req.params;

        // Validate if the provided ID is a valid MongoDB ObjectId
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({
            success: false,
            message: "Invalid application ID format",
          });
        }

        const query = { _id: new ObjectId(id) };
        const result = await applicationCollection.deleteOne(query);

        // Check if the application actually existed in the database
        if (result.deletedCount === 0) {
          return res.status(404).send({
            success: false,
            message: "Job application not found",
          });
        }

        res.status(200).send({
          success: true,
          message: "Job application deleted successfully",
          deletedCount: result.deletedCount,
        });
      } catch (error) {
        console.error("DELETE Application Error:", error);
        res.status(500).send({
          success: false,
          message: "Failed to delete job application",
          error: error.message,
        });
      }
    });



    app.get('/api/applications/:applicantEmail', async (req, res) => {
      try {
        const { applicantEmail } = req.params;

        if (!applicantEmail) {
          return res.status(400).send({
            success: false,
            message: "Applicant email parameter is required",
          });
        }

        const query = {};

        // If the param is not "all", filter applications by applicantEmail case-insensitively
        if (applicantEmail.toLowerCase() !== "all") {
          query.applicantEmail = { $regex: new RegExp(`^${applicantEmail}$`, "i") };
        }

        const applications = await applicationCollection.find(query).toArray();

        res.status(200).send({
          success: true,
          count: applications.length,
          applications,
        });
      } catch (error) {
        console.error("GET Applications Error:", error);
        res.status(500).send({
          success: false,
          message: "Error fetching applications",
          error: error.message,
        });
      }
    });


    app.get('/api/applicants/:jobEmail', async (req, res) => {
      try {
        const { jobEmail } = req.params;

        if (!jobEmail) {
          return res.status(400).json({
            success: false,
            message: "Applicant email parameter is required",
          });
        }

        const query = {};

        // If not "all", filter case-insensitively and safely (ReDoS protected)
        if (jobEmail.toLowerCase() !== "all") {
          const escapedEmail = jobEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          query.jobEmail = { $regex: new RegExp(`^${escapedEmail}$`, "i") };
        }

        const applications = await applicationCollection.find(query).toArray();

        return res.status(200).json({
          success: true,
          count: applications.length,
          applications,
        });
      } catch (error) {
        console.error("GET Applicants Error:", error);
        return res.status(500).json({
          success: false,
          message: "Error fetching applications",
          error: error.message,
        });
      }
    });


    app.delete('/api/savejob', async (req, res) => {
      try {
        const { id, email } = req.query;

        if (!id || !email) {
          return res.status(400).json({
            success: false,
            message: "Job ID and user email are required for deletion."
          });
        }

        const query = {
          userEmail: email,
          $or: [
            { id: id },
            { _id: id }
          ]
        };

        const result = await savejobCollection.deleteOne(query);

        if (result.deletedCount === 0) {
          return res.status(404).json({
            success: false,
            message: "Saved job not found or unauthorized."
          });
        }

        res.status(200).json({
          success: true,
          message: "Saved job removed successfully."
        });
      } catch (error) {
        console.error("Delete Saved Job Error:", error);
        res.status(500).json({
          success: false,
          message: "Failed to delete saved job",
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