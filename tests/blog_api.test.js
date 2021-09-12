const supertest = require('supertest')
const mongoose = require('mongoose')
const helper = require('./blog_api_helper')
const app = require('../app')
const api = supertest(app)
const Blog = require('../models/blog')
const bcrypt = require('bcrypt')
const User = require('../models/user')

beforeEach(async () => {
    await Blog.deleteMany({})

    const blogObjects = helper.initialBlogs.map(blog => new Blog(blog))

    const promiseArray = blogObjects.map(blog => blog.save())

    await Promise.all(promiseArray)
})

describe('BLOGS-HTTP-GET tests', () => {
    test('blogs are returned as JSON', async () => {
        await api
            .get('/api/blogs')
            .expect(200)
            .expect('Content-Type',/application\/json/)
    })

    test('object transformation succeeded: id instead of _id', async () => {
        const blogs = await helper.blogsInDb()
        for (let blog of blogs) {
            expect(blog.id).toBeDefined()
            expect(blog._id).not.toBeDefined()
        }
    })
})

describe('BLOGS-HTTP-POST tests', () =>{
    test('post to /api/blogs', async () => {
        const newBlog = {
            title: "NextLevelBlog2",
            author: "Anon",
            url: "google.com",
            likes: "420"
        }

        await api
            .post('/api/blogs')
            .send(newBlog)
            .expect(201)
            .expect('Content-Type',/application\/json/)

        const blogsAtEnd = await helper.blogsInDb()
        expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)

        const titles = blogsAtEnd.map(t => t.title)
        expect(titles).toContain('NextLevelBlog2')
    })

    test('if likes missing default to 0', async () => {
        const newBlogWithoutLikes = {
            title: "NextLevelBlog2",
            author: "Anon",
            url: "google.com",
        }

        await api
            .post('/api/blogs')
            .send(newBlogWithoutLikes)
            .expect(201)
            .expect('Content-Type',/application\/json/)

        const blogsAtEnd = await helper.blogsInDb()
        expect(blogsAtEnd.filter(t => t.title === "NextLevelBlog2" && t.url === "google.com")[0].likes).toBe(0)
    })

    test('status code 400, if title or url is missing', async () => {
        const blogsAtStart = await helper.blogsInDb()

        const newBlogWithoutTitle = {
            author: "Anon",
            url: "google.com",
            likes: "420"
        }

        const newBlogWithoutURL = {
            title: "NextLevelBlog2",
            author: "Anon",
            likes: "420"
        }

        await api
            .post('/api/blogs')
            .send(newBlogWithoutTitle)
            .expect(400)
            .expect('Content-Type',/application\/json/)

        await api
            .post('/api/blogs')
            .send(newBlogWithoutURL)
            .expect(400)
            .expect('Content-Type',/application\/json/)

        const blogsAtEnd = await helper.blogsInDb()
        expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
    })
})

describe('BLOGS-HTTP-DELETE tests', () => {
    beforeEach(async () => {
        await User.deleteMany({})
        await Blog.deleteMany({})

        let passwordHash = await bcrypt.hash('sekret',10)
        const root = new User({username: 'root', passwordHash})

        await root.save()

        passwordHash = await bcrypt.hash('sekret',10)
        const mluukkai = new User({username: 'mluukkai', passwordHash})

        await mluukkai.save()

        const result = await api
            .post("/api/login")
            .send({
                username: "mluukkai",
                password: "sekret"
            })

        const token = "bearer " + result.body.token.toString()

        await api
            .post("/api/blogs")
            .set('Authorization', token)
            .send({
                title: "Go To Statement Considered Harmful",
                author: "Edsger W. Dijkstra",
                url: "http://www.u.arizona.edu/~rubinson/copyright_violations/Go_To_Considered_Harmful.html"
            })



    })

    test('succeeds with status code 204 if id and token is valid', async () => {
        const blogsAtStart = await helper.blogsInDb()
        const blogToDelete = blogsAtStart[0]

        const result = await api
            .post("/api/login")
            .send({
                username: "mluukkai",
                password: "sekret"
            })
        const token = "bearer " + result.body.token
        await api
            .delete(`/api/blogs/${blogToDelete.id}`)
            .set('Authorization', token)
            .expect(204)

        const blogsAtEnd = await helper.blogsInDb()

        expect(blogsAtEnd).toHaveLength(blogsAtStart.length - 1)

        const titles = blogsAtEnd.map(t => t.title)

        expect(titles).not.toContain(blogToDelete.title)
    })

    test('fails with status code 401 if id valid but token is invalid', async () => {
        const blogsAtStart = await helper.blogsInDb()
        const blogToDelete = blogsAtStart[0]

        const token = 'bearer invalid token'
        const result = await api
            .delete(`/api/blogs/${blogToDelete.id}`)
            .set('Authorization', token)
            .expect(401)

        expect(result.body.error).toContain('invalid token')

        const blogsAtEnd = await helper.blogsInDb()

        expect(blogsAtEnd).toHaveLength(blogsAtStart.length)

        const titles = blogsAtEnd.map(t => t.title)

        expect(titles).toContain(blogToDelete.title)
    })

    test('fails with status code 401 if id valid but token is not provided', async () => {
        const blogsAtStart = await helper.blogsInDb()
        const blogToDelete = blogsAtStart[0]

        const token = 'bearer invalid token'
        const result = await api
            .delete(`/api/blogs/${blogToDelete.id}`)
            .expect(401)

        expect(result.body.error).toContain('invalid token')

        const blogsAtEnd = await helper.blogsInDb()

        expect(blogsAtEnd).toHaveLength(blogsAtStart.length)

        const titles = blogsAtEnd.map(t => t.title)

        expect(titles).toContain(blogToDelete.title)
    })

})

describe('BLOGS-HTTP-PUT tests', () => {
    test('succeeds with status code 204 data and id is valid', async () => {
        const blogsAtStart = await helper.blogsInDb()
        const blogToUpdate = blogsAtStart[0]
        const twotimelikes = blogToUpdate.likes*2
        const blogToUpdateWithTwoTimeLike = {...blogToUpdate, likes: twotimelikes}

        await api
            .put(`/api/blogs/${blogToUpdate.id}`)
            .send(blogToUpdateWithTwoTimeLike)
            .expect(200)

        const blogsAtEnd = await helper.blogsInDb()

        expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)

        const updatedBlog = blogsAtEnd.filter(t => t.id === blogToUpdate.id)[0]

        expect(updatedBlog.likes).toBe(twotimelikes)
    })
})

describe('USER-when there is initially one user in db', () => {
    beforeEach(async () => {
        await User.deleteMany({})

        const passwordHash = await bcrypt.hash('sekret',10)
        const user = new User({username: 'root', passwordHash})

        await user.save()
    })

    test('creation succeeds with a fresh username', async () => {
        const usersAtStart = await helper.usersInDb()

        const newUser = {
            username: 'mluukkai',
            name: 'Matti Luukkainen',
            password: 'salainen'
        }

        await api
            .post('/api/users')
            .send(newUser)
            .expect(200)
            .expect('Content-Type', /application\/json/)

        const usersAtEnd = await helper.usersInDb()
        expect(usersAtEnd).toHaveLength(usersAtStart.length + 1)

        const usernames = usersAtEnd.map(t => t.username)
        expect(usernames).toContain(newUser.username)
    })

    test('creation fails with proper status code and message if username already taken', async () => {
        const usersAtStart = await helper.usersInDb()

        const newUser = {
            username: 'root',
            name: 'Superuser',
            password: 'salainen'
        }

        const result = await api
            .post('/api/users')
            .send(newUser)
            .expect(400)
            .expect('Content-Type', /application\/json/)

        const userAtEnd = await helper.usersInDb()
        expect(userAtEnd).toHaveLength(usersAtStart.length)
    })

    test('creation failed with status code 400 if invalid username', async () => {
        const usersAtStart = await helper.usersInDb()

        const newUserWithShortUserName = {
            username: 'ro',
            name: 'Superuser',
            password: 'salainen'
        }

        const newUserWithoutUserName = {
            name: 'Superuser',
            password: 'salainen'
        }

        const result = await api
            .post('/api/users')
            .send(newUserWithShortUserName)
            .expect(400)
            .expect('Content-Type', /application\/json/)

        const result1 = await api
            .post('/api/users')
            .send(newUserWithoutUserName)
            .expect(400)
            .expect('Content-Type', /application\/json/)

        const userAtEnd = await helper.usersInDb()
        expect(userAtEnd).toHaveLength(usersAtStart.length)
    })

    test('creation failed with status code 400 if invalid password', async () => {
        const usersAtStart = await helper.usersInDb()

        const newUserWithShortPassword = {
            username: 'root1',
            name: 'Superuser',
            password: 'se'
        }

        const newUserWithoutPassword = {
            username: 'ro',
            name: 'Superuser',
        }

        const result = await api
            .post('/api/users')
            .send(newUserWithShortPassword)
            .expect(400)
            .expect('Content-Type', /application\/json/)

        const result1 = await api
            .post('/api/users')
            .send(newUserWithoutPassword)
            .expect(400)
            .expect('Content-Type', /application\/json/)

        const userAtEnd = await helper.usersInDb()
        expect(userAtEnd).toHaveLength(usersAtStart.length)
    })


})

afterAll(() => {
    mongoose.connection.close()
})