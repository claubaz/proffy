import { Request, Response } from 'express';
import db from '../database/connection';

export default class ConnnectionsController {
    async index(req: Request, res: Response) {
        const connections = await db('connections').count('* as total');
        const { total } = connections[0];
        return res.json({total});
    };

    async create(req: Request, res: Response) {
        const { user_id } = req.body;

        await db("connections").insert({
            user_id
        });

        return res.sendStatus(201);        
    };
}