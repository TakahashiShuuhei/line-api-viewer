import { Datastore } from "@google-cloud/datastore";
import { Operator } from "@google-cloud/datastore/build/src/query";

const NAMESPACE = "line-bot";
const datastore: Datastore = new Datastore({
  projectId: process.env.GOOGLE_CLOUD_PROJECT,
  namespace: NAMESPACE,
});

export interface Entity {
  [key: string]: any;
}

export const create = async (kind: string, data: Entity) => {
  const key = datastore.key([kind]);
  const entity = {
    key,
    data,
  };
  try {
    await datastore.save(entity);
    return key.id as string
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const get = async (kind: string, id: string): Promise<Entity | null> => {
  const key = datastore.key([kind, id]);
  try {
    const [entity] = await datastore.get(key);
    return entity || null;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const update = async (kind: string, id: string, data: Entity): Promise<void> => {
  const key = datastore.key([kind, id]);
  const entity = {
    key,
    data,
  };
  try {
    await datastore.update(entity);
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const find = async (
  kind: string,
  filters?: Array<{ property: string; operator: Operator; value: any }>
): Promise<Entity[]> => {
  let query = datastore.createQuery(NAMESPACE, kind);

  if (filters) {
    filters.forEach(filter => {
      query = query.filter(filter.property, filter.operator, filter.value);
    });
  }

  try {
    const [entities] = await datastore.runQuery(query);
    return entities;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const remove = async (kind: string, id: string): Promise<void> => {
  const key = datastore.key([kind, id]);
  try {
    await datastore.delete(key);
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const save = async (kind: string, id: string, data: Entity): Promise<void> => {
  const key = datastore.key([kind, id]);
  const entity = {
    key,
    data,
  };
  try {
    await datastore.save(entity);
  } catch (error) {
    console.error(error);
    throw error;
  }
};