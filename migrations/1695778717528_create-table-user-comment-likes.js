/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('user_comment_likes', {
    id: {
      type: 'VARCHAR(50)',
      primaryKey: true,
    },
    comment_id: {
      type: 'VARCHAR(50)',
      notNull: true,
      references: 'comments',
    },
    user_id: {
      type: 'VARCHAR(50)',
      notNull: true,
      references: 'users',
    },
  });

  /*
    Menambahkan constraint UNIQUE, kombinasi dari kolom comment_id dan user_id.
    Guna menghindari duplikasi data antara nilai keduanya.
  */
  pgm.addConstraint('user_comment_likes', 'unique_comment_id_and_user_id', 'UNIQUE(comment_id, user_id)');
};

exports.down = (pgm) => {
  pgm.dropTable('user_comment_likes');
};
