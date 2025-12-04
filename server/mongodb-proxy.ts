/**
 * Servidor Proxy MongoDB
 * 
 * Conecta diretamente ao MongoDB e expõe endpoints REST
 * para o frontend consumir
 */

import express, { Request, Response } from 'express'
import cors from 'cors'
import { MongoClient, Db, C