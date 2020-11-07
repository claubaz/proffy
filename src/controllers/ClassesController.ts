import { Request, Response } from 'express';
import { fileURLToPath } from 'url';
import db from '../database/connection';
import convertHourToMinutes from '../utils/convertHourToMinutes';

interface ScheduleItem  {
    week_day: number;
    from: string;
    to: string;
}

export default class ClassesController {
    async index(req: Request, res: Response) {
        const filter = req.query;

        if (!filter.week_day || !filter.subject || !filter.time) {
            return res.sendStatus(400).json({
                error: 'Missing filters to search classes'
            });
        }

        const week_day = filter.week_day as string;
        const subject = filter.subject as string;
        const time = filter.time as string;

        const timeInMinutes = convertHourToMinutes(time);

        const classes = await db('classes')
            .whereExists(function() {
                this.select('schedule.*')
                    .from('schedule')
                    .whereRaw('`schedule`.`class_id` = `classes`.`id`')
                    .whereRaw('`schedule`.`week_day` == ??', [Number(week_day)])
                    .whereRaw('`schedule`.`from` <= ??', [timeInMinutes])
                    .whereRaw('`schedule`.`to` > ??', [timeInMinutes])
            })
            .where('classes.subject', '=', subject)
            .join('users', 'classes.user_id', '=', 'users.id')
            .select(['classes.*', 'users.*'])

        return res.json(classes);
    };

    async create(req: Request, res: Response) {
        const {
            name,
            avatar,
            whatsapp,
            bio,
            subject,
            cost,
            schedule
        } = req.body;

        const trx = await db.transaction()

        try { 
            
            const insertedUsersIds = await trx('users').insert({ 
                name,
                avatar,
                whatsapp,
                bio,
            });

            const user_id = insertedUsersIds[0];

            const insertedClassesIds = await trx('classes').insert({
                subject,
                cost,
                user_id
            });

            const class_id = insertedClassesIds[0];

            const classSchedule = schedule.map((scheduleItem:ScheduleItem) => {
                return {
                    class_id,
                    week_day: scheduleItem.week_day,
                    from: convertHourToMinutes(scheduleItem.from),
                    to: convertHourToMinutes(scheduleItem.to)
                };
            })

            await trx('schedule').insert(classSchedule);

            //so no commit que insere tudo no banco de dados
            await trx.commit();

            return res.sendStatus(201);
        
    } catch(err) {
        await trx.rollback()
        return res.sendStatus(400).json({
            error: "unexpected error while creating a new class"
        })
    }
    }
};