export function setResponseType(req, res, next) {
    res.type('json');
    next()
}
