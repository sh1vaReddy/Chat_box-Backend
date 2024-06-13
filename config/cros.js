const corsoption = {
    origin: process.env.CLIENT_URL ? [process.env.CLIENT_URL] : [],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
};

export default corsoption;
