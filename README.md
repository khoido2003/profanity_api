# Profanity Checking API with Upstash and HonoJS

This project implements a simple Profanity Checking API using Upstash, a serverless Redis service, and HonoJS, a lightweight Node.js web framework.

## Overview

The Profanity Checking API allows users to submit text content and receive a response indicating whether the text contains any profane language. The API utilizes a Redis database hosted on Upstash to store a list of profane words. HonoJS is used to create the web server that handles incoming requests and performs the profanity checking.

## Prerequisites

Before running the application, ensure you have the following installed:

- Node.js (https://nodejs.org/)
- npm (comes with Node.js)
