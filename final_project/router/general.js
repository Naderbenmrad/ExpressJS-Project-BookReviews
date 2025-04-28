const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

const doesExist = (username) => {
  let userswithsamename = users.filter((user) => {
      return user.username === username;
  });
  if (userswithsamename.length > 0) {
      return true;
  } else {
      return false;
  }
}

public_users.post("/register", (req,res) => {
  const username = req.body.username;
  const password = req.body.password;
  if (username && password) {
      if (!doesExist(username)) {
          users.push({"username": username, "password": password});
          return res.status(200).json({message: "User successfully registered. Now you can login"});
      } else {
          return res.status(404).json({message: "User already exists!"});
      }
  }
  return res.status(404).json({message: "Unable to register user.",
    username: username,
    password: password
  });
});

// Get the book list available in the shop
public_users.get('/',function (req, res) {
  new Promise((resolve, reject) => {
    setTimeout(() => resolve(books), 100);
  })
    .then(data => res.json(data))
    .catch(error => res.status(500).json({ message: "Error fetching books", error: error.message }));
});

// Get book details based on ISBN
public_users.get('/isbn/:isbn', function (req, res) {
  const isbn = req.params.isbn;
  new Promise((resolve, reject) => {
    setTimeout(() => {
      if (books[isbn]) {
        resolve(books[isbn]);
      } else {
        reject(new Error("Book not found"));
      }
    }, 100);
  })
    .then(book => {
      res.status(200).json({
        message: "Book retrieved successfully",
        book: book
      });
    })
    .catch(error => {
      res.status(404).json({
        message: error.message,
        isbn: isbn
      });
    });
});
  
// Get book details based on author
public_users.get('/author/:author',function (req, res) {
  const author = req.params.author;
  new Promise((resolve, reject) => {
    setTimeout(() => {
      const authorBooks = Object.values(books).filter(book =>
        book.author.toLowerCase() === author.toLowerCase()
      );
      if (authorBooks.length === 0) {
        reject(new Error("No books found for this author"));
      } else {
        resolve(authorBooks);
      }
    }, 100);
  })
    .then(authorBooks => {
      res.status(200).json({
        message: "Books retrieved successfully",
        books: authorBooks
      });
    })
    .catch(error => {
      res.status(404).json({
        message: error.message,
        author: author
      });
    });
});

// Get all books based on title
public_users.get('/title/:title',function (req, res) {
  const title = req.params.title;
  new Promise((resolve, reject) => {
    setTimeout(() => {
      const titleBooks = Object.values(books).filter(book =>
        book.title.toLowerCase() === title.toLowerCase()
      );
      if (titleBooks.length === 0) {
        reject(new Error("No books found for this title"));
      } else {
        resolve(titleBooks);
      }
    }, 100);
  })
    .then(titleBooks => {
      res.status(200).json({
        message: "Books retrieved successfully",
        books: titleBooks
      });
    })
    .catch(error => {
      res.status(404).json({
        message: error.message,
        title: title
      });
    });
});

//  Get book review
public_users.get('/review/:isbn',function (req, res) {
  const isbn = req.params.isbn;
  if (!books[isbn]) {
    return res.status(404).json({
      message: "Book not found",
      isbn: isbn
    });
  }
  if (!books[isbn].reviews || books[isbn].reviews.length === 0) {
    return res.status(404).json({
      message: "No reviews found for this book",
      isbn: isbn
    });
  }
  return res.status(200).json({
    message: "Reviews retrieved successfully",
    isbn: isbn,
    reviews: books[isbn].reviews
  });
});

module.exports.general = public_users;
