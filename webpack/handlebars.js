module.exports = () => {
    return {
        module: {
            rules: [
                {
                    test: /\.handlebars$/,
                    loader: "handlebars-loader",
                    options: {
                        pretty: true
                    }
                }
            ]
        }
    }
};