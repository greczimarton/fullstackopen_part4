const router = require('express').Router()
const Blog = require('../models/user')
const User = require('../models/blog')
const {request, response} = require("express");

router.post('/reset', async (request,response) => {
    await Blog.deleteMany({})
    await User.deleteMany({})

    response.status(204).end()
})

module.exports = router