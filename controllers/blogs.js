const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const User = require('../models/user')
const jwt = require('jsonwebtoken')
const {userExtractor} = require("../utils/middleware");

blogsRouter.get('/', async (request, response) => {
    const blogs = await Blog.find({}).populate('user', {username: 1, name: 1})
    response.json(blogs)
})

blogsRouter.post('/', userExtractor, async (request, response) => {
    const body = request.body

    if  (body.title === undefined){
        return response.status(400).json({error: "title missing"})
    }

    if  (body.url === undefined){
        return response.status(400).json({error: "url missing"})
    }

    const user = request.user
    console.log('userToPost', user)

    const blog = new Blog({
        title: body.title,
        author: body.author,
        url: body.url,
        likes: body.likes ? body.likes : 0,
        user: user._id
    })

    const savedBlog = await blog.save()
    user.blogs = user.blogs.concat(savedBlog._id)
    await user.save()

    response.status(201).json(savedBlog)
})

blogsRouter.delete('/:id', userExtractor,async (request,response) => {
    const user = request.user
    console.log('userDeleting', user)

    const blog = await Blog.findById(request.params.id)

    if (blog.user.toString() === user._id.toString()){
        await Blog.findByIdAndRemove(request.params.id)
        return response.status(204).end()
    }
    else{
        return response.status(400).send({error: 'unauthorized delete'})
    }
})

blogsRouter.put('/:id', async (request,response) => {
    const body = request.body

    const newBlog = {
        title: body.title,
        author: body.author,
        url: body.url,
        likes: body.likes
    }

    const updatedNote = await Blog.findByIdAndUpdate(request.params.id, newBlog, {new: true}).populate('user', {username: 1, name: 1})
    response.json(updatedNote)
})

module.exports = blogsRouter

