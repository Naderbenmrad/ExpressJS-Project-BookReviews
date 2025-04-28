const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username)=>{ 
if (!username || typeof username !== 'string') {
  return false;
}
if (username.length < 3) {
  return false;
}
const validUsernameRegex = /^[a-zA-Z0-9_]+$/;
if (!validUsernameRegex.test(username)) {
  return false;
}
return true;
}

const authenticatedUser = (username, password) => {
  let validusers = users.filter((user) => {
      return (user.username === username && user.password === password);
  });
  if (validusers.length > 0) {
      return true;
  } else {
      return false;
  }
}

//only registered users can login
regd_users.post("/customer/login", (req,res) => {
  const username = req.body.username;
  const password = req.body.password;
  if (!username || !password) {
      return res.status(404).json({ message: "Error logging in" });
  }
  if (authenticatedUser(username, password)) {
      let accessToken = jwt.sign({
          data: password
      }, 'access', { expiresIn: 60 });
      req.session.authorization = {
          accessToken, username
      }
      return res.status(200).send("User successfully logged in");
  } else {
      return res.status(208).json({ message: "Invalid Login. Check username and password" });
  }
});

// Add a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
  if (!req.session.authorization) {
    return res.status(401).json({
      message: "Please login to post a review"
    });
  }
  const isbn = req.params.isbn;
  const username = req.session.authorization.username;
  const review = req.query.review;
  if (!review) {
    return res.status(400).json({
      message: "Review text is required in query parameter",
      example: "/auth/review/1?review=Great book!"
    });
  }
  let book = books[isbn];
  if (!book) {
    return res.status(404).json({
      message: "Book not found",
      isbn: isbn
    });
  }
  if (!book.reviews) {
    book.reviews = [];
  }
  const existingReviewIndex = book.reviews.findIndex(r => r.username === username);
  if (existingReviewIndex >= 0) {
    book.reviews[existingReviewIndex].review = review;
    book.reviews[existingReviewIndex].date = new Date();
    return res.status(200).json({
      message: "Review updated successfully",
      review: book.reviews[existingReviewIndex]
    });
  }
  const newReview = {
    username: username,
    review: review,
    date: new Date()
  };
  book.reviews.push(newReview);
  books[isbn] = book;
  return res.status(201).json({
    message: "Review added successfully",
    review: newReview
  });
});

regd_users.delete("/auth/review/:isbn", (req, res) => {
  if (!req.session.authorization) {
    return res.status(401).json({
      message: "Please login to delete a review"
    });
  }

  const isbn = req.params.isbn;
  const username = req.session.authorization.username;

  let book = books[isbn];
  if (!book) {
    return res.status(404).json({
      message: "Book not found",
      isbn: isbn
    });
  }

  if (!book.reviews || book.reviews.length === 0) {
    return res.status(404).json({
      message: "No reviews found for this book",
      isbn: isbn
    });
  }

  const reviewIndex = book.reviews.findIndex(review => review.username === username);
  
  if (reviewIndex === -1) {
    return res.status(404).json({
      message: "You have not reviewed this book",
      isbn: isbn
    });
  }

  book.reviews.splice(reviewIndex, 1);
  books[isbn] = book;

  return res.status(200).json({
    message: "Review deleted successfully",
    isbn: isbn
  });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
