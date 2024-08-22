const Task = require('../models/task');

class Category {
    constructor(name, colorCode) {
        this.name = name;
        this.colorCode = colorCode;
    }
}

function createCategory (name, colorCode) {
    const categoryName = new Category(name, colorCode)
}

function editCategory(category) {

}