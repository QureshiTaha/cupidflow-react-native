module.exports = (dependencies) => {
    return async (req, res, next) => {
        try {
                // req.session.destroy((err) => {
                //     if (err) {
                        // res.status(400).send("Unable to log out");
                       
                    // } else {
                        res.send("Logout successful");
                    // }
                // });
            
        } catch (err) {
            res.status(400).json(err.toString());
        }
    };
};