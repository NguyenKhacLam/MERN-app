const mongooes = require('mongoose');
const config = require('config');
const db = config.get('mongoLocal');

const connectDB = async() => {
    try {
        await mongooes.connect(db, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true,
            useFindAndModify: false
        });
        console.log('Connected!');
    } catch (error) {
        console.log(error.message);
        // Exit process with failure
        process.exit(1);
    }
};
module.exports = connectDB;