export type User = {
  id: string;
  objectId: string;
  username: string | '';
  name: string;
  bio: string;
  image: string;
};

export type Author ={
  id: string;
  name: string;
  image: string;
}

export type Community = {
  id: string;
  name: string;
  image: string;
};

export type Comment = {
  author?: Author | '';
};