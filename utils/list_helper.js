const lodash = require('lodash')

const dummy = (blogs) => {
    return 1
}

const totalLikes = (blogs) => {
    const countLikes = (sum,item) => {
        debugger
        return sum + item.likes
    }

    return blogs.reduce(countLikes,0)
}

const favoriteBlog = (blogs) => {
    const topLikes = Math.max(...blogs.map(t => t.likes))
    return blogs.filter(t => t.likes === topLikes)[0]

}

const mostBlogs = (blogs) => {
    const authors = blogs.map(t => {
        return {
            author: t.author,
            blogs: blogs.filter(l => l.author === t.author).length
        }
    })
    return lodash.maxBy(authors, t => t.blogs)

}

const mostLikes = (blogs) => {
    const authorsreally = lodash.uniqBy(blogs, t => t.author).map(t => {
        return {
            author: t.author,
            likes: lodash.sum(blogs.filter(l => l.author === t.author).map(t => t.likes))
        }
    })

    return lodash.maxBy(authorsreally, t => t.likes)

}

module.exports = {
    dummy,
    totalLikes,
    favoriteBlog,
    mostBlogs,
    mostLikes
}