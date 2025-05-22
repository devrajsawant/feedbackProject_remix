import { createDirectus, rest, authentication } from '@directus/sdk';

const directusUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL;
if(!directusUrl){
    throw new Error('DIRECTUS_URL is not defined in the environment');
}

const directus = createDirectus(directusUrl)
.with(authentication('json'))
.with(rest())

export default directus;