package com.amagen.ems.service;

import com.amagen.ems.model.Counter;
import lombok.RequiredArgsConstructor;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoOperations;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SequenceGeneratorService {

    private final MongoOperations mongoOperations;

    public String generateEmployeeCode() {
        Query query = new Query(Criteria.where("_id").is("employee_code"));
        Update update = new Update().inc("seq", 1);
        FindAndModifyOptions options = FindAndModifyOptions.options().returnNew(true).upsert(true);

        Counter counter = mongoOperations.findAndModify(query, update, options, Counter.class);
        long seq = counter != null ? counter.getSeq() : 1;
        return String.format("EMP%04d", seq);
    }
}
