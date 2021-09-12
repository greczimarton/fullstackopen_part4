const bcrypt = require('bcrypt')
const userRouter = require('express').Router()
const User = require('../models/user')

userRouter.post('/', async (request,response) => {
    const body = request.body

    if (body.password === undefined){
        return response.status(400).json({error: "password is required."})
    }

    if (body.password.length <= 3){
        return response.status(400).json({error: "password is shorter than 3 characters."})
    }

    const saltRounds = 10
    const passwordHash = await bcrypt.hash(body.password, saltRounds)

    const user = new User({
        username: body.username,
        name: body.name,
        passwordHash,
    })

    const savedUser = await user.save()
    response.json(savedUser)
})

userRouter.get('/', async (request,response) => {
    const users = await User.find({}).populate('blogs',{user: 0, likes: 0})
    response.json(users)
})

module.exports = userRouter
