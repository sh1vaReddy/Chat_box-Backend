class ErrorHandler extends Error{
    constructor(message,statuscode,)
    {
        super(message);
        this.statuscode=statuscode;
        this.message=message
    }
}


export {ErrorHandler}