module.exports = function(imports) {
    return new Promise(async function(resolve) {


        // await new Promise(function(resolve) {

        //     imports.onlykeyApi.api.check(function(err) {
        //         if (!err)
        //             console.log("connected to onlykey")
        //         else
        //             throw err;

        //         resolve();
        //     })

        // })

        await new Promise(function(resolve) {

            imports.onlykeyApi.api.connect(function(err) {
                if (!err)
                    console.log("connected to onlykey")
                else
                    throw err;

                resolve();
            })

        })


        resolve();
    });
};