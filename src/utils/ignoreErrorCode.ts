export default async <T>(promises: Promise<T> | Promise<T>[], code: string) => {
    if (!Array.isArray(promises)) {
        try {
            return await promises;
        } catch (err) {
            if (err instanceof Error && 'code' in err && err.code === code)
                return;
            
            throw err;
        }
    }

    const results = await Promise.allSettled(promises);
    return results.reduce<T[]>((acc, result) => {
        if (result.status === 'fulfilled')
            acc.push(result.value);
        else {
            const err = result.reason;
            if (!(err instanceof Error && 'code' in err && err.code === code))
                throw err;
        }
        
        return acc;
    }, []);
};
