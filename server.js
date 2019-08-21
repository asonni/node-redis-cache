const express = require('express');
const axios = require('axios');
const redis = require('redis');

const PORT = process.env.PORT || 5000;
const REDIS_PORT = process.env.REDIS_PORT || 6379;

const client = redis.createClient(REDIS_PORT);

const app = express();

// Set response
const setResponse = (username, repos) =>
  `<h2>${username} has ${repos} Github repos</h2>`;

// Make request to Github for data
const getRepos = async (req, res) => {
  try {
    console.log('Fetching Data...');

    const { username } = req.params;

    const { data } = await axios.get(
      `https://api.github.com/users/${username}`
    );

    const repos = data.public_repos;

    // Set data to Redis
    client.setex(username, 3600, repos);

    res.send(setResponse(username, repos));
  } catch (error) {
    console.error(error);
    res.status(500);
  }
};

// Cache middleware
const cache = (req, res, next) => {
  const { username } = req.params;

  client.get(username, (err, data) => {
    if (err) throw err;

    if (data != null) {
      res.send(setResponse(username, data));
    } else {
      next();
    }
  });
};

app.get('/repos/:username', cache, getRepos);

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});
