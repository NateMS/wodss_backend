# wodss
Backend for the wodss-application spring semester 19.

## Start
### Installing Dependencies
`npm install`

MongoDB has to be installed and running
### Starting the server
`npm start`

## Schemas

- employee
    - Fields
        - _id
            - String
            - Required
        - password
            - String
        - active
            - Boolean
        - firstName
            - String
        - lastName
            - String
        - emailAddress
            - String
        - role
            - enum ['ADMINISTRATOR', 'PROJECTMANAGER', 'DEVELOPER']
    - Virtuals
        - id
            - String, maps the param _id to the API-Definition of "id"


## (obsolete) Tables
- projects
    - project_id
    - name
    - description
    - project_manager_id
    - workload_need
    - start_date
    - end_date
    - is_active

- roles
    - role_id
    - name

- users
    - user_id
    - name
    - email
    - password
    - workload

- user_role
    - user_id
    - role_id

- project_user
    - project_id
    - user_id
    - workload
