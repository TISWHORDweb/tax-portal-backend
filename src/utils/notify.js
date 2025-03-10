const { emailTemple } = require("../services");



exports.EmailNote = async (email, name, body, subject) => {
    try {
        await new emailTemple(email)
            .who(name)
            .body(body)
            .subject(subject).send().then(r => console.log(r));
    } catch (e) {
        console.log("Error sending:", e);
        return e
    }
}

