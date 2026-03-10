const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// 1. THE VAULT CONNECTION
// Notice the "/taskManager" I added before the question mark. This creates a specific database just for this app!
const MONGO_URI = 'mongodb+srv://surajmateti:TaskApp123@cluster0.20ezjkc.mongodb.net/taskManager?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGO_URI)
  .then(() => console.log('🔥 Successfully connected to MongoDB Vault!'))
  .catch(err => console.error('MongoDB connection error:', err));

// 2. THE BLUEPRINT (Schema)
// This tells Mongo exactly what a "Task" should look like
const taskSchema = new mongoose.Schema({
  id: Number, 
  title: String,
  completed: Boolean
});

// This creates the actual "Model" we use to interact with the database
const Task = mongoose.model('Task', taskSchema);

// --- THE REAL DATABASE API ENDPOINTS ---

// READ: Ask Mongo for all tasks
app.get('/tasks', async (req, res) => {
  // We grab all tasks, but strip away Mongo's internal data so Angular doesn't get confused
  const tasks = await Task.find({}, '-_id id title completed'); 
  res.json(tasks);
});

// CREATE: Save a new task permanently
app.post('/tasks', async (req, res) => {
  const newTask = new Task({
    id: Date.now(),
    title: req.body.title,
    completed: false
  });
  
  await newTask.save(); // Saves to the cloud!
  res.status(201).json({ id: newTask.id, title: newTask.title, completed: newTask.completed });
});

// UPDATE: Update the checkbox in the cloud
app.put('/tasks/:id', async (req, res) => {
  const taskId = parseInt(req.params.id);
  const updatedTask = await Task.findOneAndUpdate(
    { id: taskId }, 
    { completed: req.body.completed }, 
    { new: true } // Returns the newly updated document
  );
  
  if (updatedTask) {
    res.json({ id: updatedTask.id, title: updatedTask.title, completed: updatedTask.completed });
  } else {
    res.status(404).json({ message: 'Task not found!' });
  }
});

// DELETE: Permanently remove from the cloud
app.delete('/tasks/:id', async (req, res) => {
  const taskId = parseInt(req.params.id);
  await Task.findOneAndDelete({ id: taskId });
  res.json({ message: 'Task permanently deleted' });
});

// Start the engine
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});